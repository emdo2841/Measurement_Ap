import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1'

function getMessage(payload: unknown, fallback: string) {
  if (typeof payload !== 'object' || payload === null) return fallback
  const value = payload as { error?: unknown; message?: unknown }
  if (typeof value.error === 'string') return value.error
  if (typeof value.message === 'string') return value.message
  return fallback
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email address...')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing its token.')
      return
    }

    void fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(getMessage(payload, 'Email verification failed.'))
      setStatus('success')
      setMessage(getMessage(payload, 'Email verified successfully.'))
    }).catch((cause) => {
      setStatus('error')
      setMessage(cause instanceof Error ? cause.message : 'Email verification failed.')
    })
  }, [token])

  async function resendVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      setResending(true)
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(getMessage(payload, 'Could not resend the email.'))
      setMessage(getMessage(payload, 'A new verification link has been sent.'))
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not resend the email.')
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${status === 'success' ? 'bg-emerald-100 text-emerald-700' : status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {status === 'success' ? '✓' : status === 'error' ? '!' : '…'}
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Email verification</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {status === 'error' && (
          <form onSubmit={resendVerification} className="mt-5 space-y-3 text-left">
            <label className="block text-sm font-medium text-slate-700">Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3" required />
            </label>
            <button type="submit" disabled={resending} className="w-full rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-600 disabled:opacity-50">{resending ? 'Sending...' : 'Send a new verification link'}</button>
          </form>
        )}
        {status !== 'loading' && <Link to="/" className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Go to sign in</Link>}
      </section>
    </main>
  )
}
