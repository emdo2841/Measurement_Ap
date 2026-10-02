import { useEffect, useRef, useState } from 'react'
import { LoginForm, SignupForm } from './AuthForms'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1'


declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (element: HTMLElement, options: { theme: string; size: string }) => void
        }
      }
    }
  }
}

type AuthMode = 'login' | 'signup'
type AuthPanelProps = { onAuthenticated: () => void }

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data !== 'object' || data === null) return fallback
  const result = data as { message?: unknown; error?: unknown }
  if (typeof result.message === 'string') return result.message
  if (typeof result.error === 'string') return result.error
  return fallback
}

function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setGoogleReady(true)
      return
    }

    const scriptId = 'google-gsi'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      document.head.appendChild(script)
    }

    const onLoad = () => setGoogleReady(true)
    const onError = () => setError('Google sign-in could not load. Please refresh the page.')
    script.addEventListener('load', onLoad)
    script.addEventListener('error', onError)
    return () => {
      script?.removeEventListener('load', onLoad)
      script?.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    if (!googleReady || !googleButtonRef.current) return

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const googleId = window.google?.accounts?.id
    if (!googleClientId || !googleId) {
      setError('Google sign-in is not configured. Check VITE_GOOGLE_CLIENT_ID.')
      return
    }

    googleId.initialize({
      client_id: googleClientId,
      callback: async ({ credential }) => {
        if (!credential) {
          setError('Google did not return a sign-in credential.')
          return
        }

        setIsSubmitting(true)
        setError('')
        try {
          const response = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ credential }),
          })
          const data = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(getErrorMessage(data, 'Google sign-in failed.'))
          if (typeof data.accessToken !== 'string') throw new Error('No access token received from the server.')
          localStorage.setItem('accessToken', data.accessToken)
          onAuthenticated()
          navigate('/dashboard', { replace: true })
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : 'Google sign-in failed.')
        } finally {
          setIsSubmitting(false)
        }
      },
    })

    googleButtonRef.current.replaceChildren()
    googleId.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large' })
  }, [googleReady, mode, onAuthenticated])

  const handleForgotPassword = async (email: string) => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) throw new Error('Please enter your email address.')

    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(getErrorMessage(data, 'Unable to send reset link.'))
  }

  const handleAuth = async (payload: {
    email: string
    password: string
    name?: string
    phone?: string
    registrationToken?: string
  }) => {
    setIsSubmitting(true)
    setError('')
    try {
      if (mode === 'login') {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: payload.email, password: payload.password }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(getErrorMessage(data, 'Login failed.'))
        if (typeof data.accessToken !== 'string') throw new Error('No access token received from the server.')
        localStorage.setItem('accessToken', data.accessToken)
        onAuthenticated()
        navigate('/dashboard', { replace: true })
        return
      }

      const formData = new FormData()
      formData.append('name', payload.name || '')
      formData.append('email', payload.email)
      formData.append('password', payload.password)
      formData.append('phone', payload.phone || '')
      formData.append('registrationToken', payload.registrationToken || '')

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(getErrorMessage(data, 'Account creation failed.'))
      setMode('login')
      setError(getErrorMessage(data, 'Account created successfully. Please sign in.'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestRegistrationCode = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/registration/request-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(getErrorMessage(data, 'Unable to send verification code.'))
  }

  const verifyRegistrationCode = async (email: string, code: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/registration/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(getErrorMessage(data, 'Unable to verify code.'))
    if (typeof data.registrationToken !== 'string') throw new Error('The server did not return a registration token.')
    return data.registrationToken
  }

  if (mode === 'login') {
    return (
      <LoginForm
        onModeChange={setMode}
        onSubmit={handleAuth}
        isSubmitting={isSubmitting}
        error={error}
        googleButtonRef={googleButtonRef}
        onForgotPassword={handleForgotPassword}
      />
    )
  }

  return (
    <SignupForm
      onModeChange={setMode}
      onSubmit={handleAuth}
      isSubmitting={isSubmitting}
      error={error}
      googleButtonRef={googleButtonRef}
      onRequestRegistrationCode={requestRegistrationCode}
      onVerifyRegistrationCode={verifyRegistrationCode}
    />
  )
}

export default AuthPanel
