import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') ?? '')
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) return setError('Reset token is missing. Please use the link sent to your email.')
    if (newPassword.length < 8) return setError('Password must be at least 8 characters long.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to reset password.')
      setMessage('Your password was reset successfully. You can now log in.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f2ec] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-7 shadow-[0_22px_55px_rgba(45,58,55,0.1)]">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#263d47] text-white shadow-[0_8px_20px_rgba(38,61,71,0.18)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></svg>
          </div>
          <h1 className="font-display text-3xl text-[#263d47]">Reset password</h1>
          <p className="mt-2 text-sm text-[#66736d]">Create a new password for your TailorPro account.</p>
        </header>

        {message ? (
          <div className="space-y-4 text-center">
            <p className="rounded-xl border border-[#bcd8c8] bg-[#eaf5ee] px-4 py-3 text-sm text-[#397153]">{message}</p>
            <Link to="/" className="inline-flex rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#36515b]">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-end"><button type="button" onClick={() => setShowPassword((current) => !current)} className="text-xs font-bold text-[#607d6f] hover:text-[#314b43]">{showPassword ? 'Hide passwords' : 'Show passwords'}</button></div>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#596861]">New password<input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Enter a new password" className="mt-1.5 w-full rounded-xl border border-[#d8dfda] bg-white px-4 py-3 text-base normal-case tracking-normal text-[#263d47] outline-none focus:border-[#82998d] focus:ring-4 focus:ring-[#778f83]/10" required /></label>
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-[#596861]">Confirm password<input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" className="mt-1.5 w-full rounded-xl border border-[#d8dfda] bg-white px-4 py-3 text-base normal-case tracking-normal text-[#263d47] outline-none focus:border-[#82998d] focus:ring-4 focus:ring-[#778f83]/10" required /></label>
            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#263d47] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#36515b] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Resetting…' : 'Reset password'}</button>
          </form>
        )}
      </section>
    </main>
  )
}
