const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1'

let refreshRequest: Promise<string> | null = null

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || typeof payload.accessToken !== 'string') {
          throw new Error('Your session has expired. Please sign in again.')
        }
        localStorage.setItem('accessToken', payload.accessToken)
        return payload.accessToken as string
      })
      .finally(() => { refreshRequest = null })
  }
  return refreshRequest
}

function errorMessage(payload: unknown, fallback: string) {
  if (typeof payload !== 'object' || payload === null) return fallback
  const result = payload as { error?: unknown; message?: unknown }
  if (typeof result.error === 'string') return result.error
  if (typeof result.message === 'string') return result.message
  return fallback
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401 && allowRefresh && path !== '/auth/refresh') {
    try {
      await refreshAccessToken()
      return apiRequest<T>(path, options, false)
    } catch (cause) {
      localStorage.removeItem('accessToken')
      window.dispatchEvent(new Event('auth:expired'))
      throw cause
    }
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(errorMessage(payload, 'The request could not be completed.'))
  return payload as T
}
