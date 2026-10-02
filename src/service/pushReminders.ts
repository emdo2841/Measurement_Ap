import { apiRequest } from '../service/api'

function urlBase64ToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0))
}

export function supportsPushNotifications() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getReminderSubscription() {
  if (!supportsPushNotifications()) return null
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  return registration?.pushManager.getSubscription() ?? null
}

export async function enableReminders() {
  if (!supportsPushNotifications()) throw new Error('Browser notifications are unavailable on this device.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const registration = await navigator.serviceWorker.register('/sw.js')
  const { publicKey } = await apiRequest<{ publicKey: string }>('/push/public-key')
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToBytes(publicKey),
  })

  await apiRequest('/push/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  return subscription
}

export async function disableReminders() {
  const subscription = await getReminderSubscription()
  if (!subscription) return

  // If your backend supports this DELETE endpoint it removes the saved row.
  // A missing endpoint does not prevent the browser subscription being disabled.
  try {
    await apiRequest('/push/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  } finally {
    await subscription.unsubscribe()
  }
}
