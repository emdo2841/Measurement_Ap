const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost/api/v1'

const DEFAULT_TIMEOUT_MS = 15_000

let refreshRequest: Promise<string> | null = null

export class ApiError extends Error {
  status: number
  details: unknown
  retryAfter: number | null

  constructor(
    message: string,
    status = 0,
    details: unknown = null,
    retryAfter: number | null = null,
  ) {
    super(message)

    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.retryAfter = retryAfter
  }
}

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number
}

function getPayloadMessage(
  payload: unknown,
  fallback: string,
): string {
  if (
    typeof payload !== 'object' ||
    payload === null
  ) {
    return fallback
  }

  const result = payload as {
    error?: unknown
    message?: unknown
  }

  if (typeof result.error === 'string') {
    return result.error
  }

  if (typeof result.message === 'string') {
    return result.message
  }

  return fallback
}

async function readResponse(
  response: Response,
): Promise<unknown> {
  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return undefined
  }

  const text = await response.text()

  if (!text.trim()) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getRetryAfter(
  response: Response,
): number | null {
  const value = response.headers.get('Retry-After')

  if (!value) return null

  const seconds = Number(value)

  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds))
  }

  const retryDate = new Date(value).getTime()

  if (Number.isNaN(retryDate)) {
    return null
  }

  return Math.max(
    0,
    Math.ceil((retryDate - Date.now()) / 1000),
  )
}

function statusMessage(
  status: number,
  retryAfter: number | null,
): string {
  switch (status) {
    case 400:
      return 'Some of the information provided is invalid.'

    case 401:
      return 'Your session has expired. Please sign in again.'

    case 403:
      return 'You do not have permission to perform this action.'

    case 404:
      return 'The requested information could not be found.'

    case 409:
      return 'This information already exists or conflicts with another record.'

    case 429:
      return retryAfter
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please wait before trying again.'

    case 500:
      return 'The server encountered an error. Please try again.'

    case 502:
      return 'The server is temporarily unavailable.'

    case 503:
      return 'The service is temporarily unavailable. Please try again shortly.'

    default:
      return 'The request could not be completed.'
  }
}

function createRequestSignal(
  callerSignal: AbortSignal | null | undefined,
  timeoutMs: number,
) {
  const controller = new AbortController()

  let cancelledByCaller = false
  let timedOut = false

  const cancelFromCaller = () => {
    cancelledByCaller = true
    controller.abort()
  }

  if (callerSignal?.aborted) {
    cancelFromCaller()
  } else {
    callerSignal?.addEventListener(
      'abort',
      cancelFromCaller,
      { once: true },
    )
  }

  const timeoutId = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  function cleanup() {
    window.clearTimeout(timeoutId)

    callerSignal?.removeEventListener(
      'abort',
      cancelFromCaller,
    )
  }

  return {
    signal: controller.signal,
    cleanup,
    wasCancelledByCaller: () => cancelledByCaller,
    didTimeOut: () => timedOut,
  }
}

async function refreshAccessToken(): Promise<string> {
  if (!refreshRequest) {
    refreshRequest = apiRequest<{
      accessToken: string
    }>(
      '/auth/refresh-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeoutMs: 10_000,
      },
      false,
    )
      .then((payload) => {
        if (
          !payload ||
          typeof payload.accessToken !== 'string'
        ) {
          throw new ApiError(
            'Your session has expired. Please sign in again.',
            401,
          )
        }

        localStorage.setItem(
          'accessToken',
          payload.accessToken,
        )

        return payload.accessToken
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
  allowRefresh = true,
): Promise<T> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.onLine === false
  ) {
    throw new ApiError(
      'You appear to be offline. Check your internet connection and try again.',
    )
  }

  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
    ...fetchOptions
  } = options

  const requestSignal = createRequestSignal(
    callerSignal,
    timeoutMs,
  )

  try {
    const token = localStorage.getItem('accessToken')

    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...fetchOptions,

        credentials: 'include',

        signal: requestSignal.signal,

        headers: {
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),

          ...fetchOptions.headers,
        },
      },
    )

    if (
      response.status === 401 &&
      allowRefresh &&
      path !== '/auth/refresh-token'
    ) {
      try {
        await refreshAccessToken()

        return await apiRequest<T>(
          path,
          {
            ...options,
            signal: callerSignal,
          },
          false,
        )
      } catch (cause) {
        localStorage.removeItem('accessToken')

        window.dispatchEvent(
          new Event('auth:expired'),
        )

        throw cause
      }
    }

    const payload = await readResponse(response)

    if (!response.ok) {
      const retryAfter = getRetryAfter(response)

      const fallback = statusMessage(
        response.status,
        retryAfter,
      )

      throw new ApiError(
        getPayloadMessage(payload, fallback),
        response.status,
        payload,
        retryAfter,
      )
    }

    return payload as T
  } catch (cause) {
    if (cause instanceof ApiError) {
      throw cause
    }

    if (requestSignal.wasCancelledByCaller()) {
      throw new DOMException(
        'The request was cancelled.',
        'AbortError',
      )
    }

    if (requestSignal.didTimeOut()) {
      throw new ApiError(
        'The request took too long. Please try again.',
      )
    }

    if (
      cause instanceof TypeError ||
      (
        typeof navigator !== 'undefined' &&
        navigator.onLine === false
      )
    ) {
      throw new ApiError(
        'Unable to reach the server. Check your internet connection and try again.',
      )
    }

    throw cause instanceof Error
      ? cause
      : new ApiError(
          'An unexpected request error occurred.',
        )
  } finally {
    requestSignal.cleanup()
  }
}