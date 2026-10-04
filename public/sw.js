const DEFAULT_NOTIFICATION_URL = '/dashboard'

function getNotificationData(event) {
  if (!event.data) {
    return {
      title: 'EJ TailorPro',
      body: 'You have a new notification.',
      url: DEFAULT_NOTIFICATION_URL,
    }
  }

  try {
    const payload = event.data.json()

    return {
      title:
        typeof payload?.title === 'string'
          ? payload.title
          : 'EJ TailorPro',

      body:
        typeof payload?.body === 'string'
          ? payload.body
          : 'You have a new notification.',

      url:
        typeof payload?.url === 'string'
          ? payload.url
          : DEFAULT_NOTIFICATION_URL,
    }
  } catch {
    return {
      title: 'EJ TailorPro',
      body: event.data.text() || 'You have a new notification.',
      url: DEFAULT_NOTIFICATION_URL,
    }
  }
}

function safeNotificationUrl(value) {
  try {
    const url = new URL(
      value || DEFAULT_NOTIFICATION_URL,
      self.location.origin,
    )

    if (url.origin !== self.location.origin) {
      return new URL(
        DEFAULT_NOTIFICATION_URL,
        self.location.origin,
      ).href
    }

    return url.href
  } catch {
    return new URL(
      DEFAULT_NOTIFICATION_URL,
      self.location.origin,
    ).href
  }
}

self.addEventListener('push', (event) => {
  const data = getNotificationData(event)
  const url = safeNotificationUrl(data.url)

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,

      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',

      data: {
        url,
      },

      tag: `ej-tailorpro-${url}`,

      renotify: false,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = safeNotificationUrl(
    event.notification.data?.url,
  )

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          const clientUrl = new URL(client.url)

          if (
            clientUrl.origin === self.location.origin &&
            'focus' in client
          ) {
            await client.focus()

            if ('navigate' in client) {
              await client.navigate(targetUrl)
            }

            return
          }
        }

        if (clients.openWindow) {
          await clients.openWindow(targetUrl)
        }
      }),
  )
})