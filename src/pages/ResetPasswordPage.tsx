import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = 'http://localhost/api/v1'

function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get('token') ?? '')
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('Reset token is missing. Please use the link sent to your email.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Unable to reset password.')
      }

      setMessage('Your password was reset successfully. You can now log in.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8e1db] px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-[#f5f3f2] p-6 shadow-xl shadow-slate-200/50">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f6fe9] shadow-lg shadow-blue-200">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M12 2.5a5 5 0 015 5v1.5A3.5 3.5 0 0113.5 12H10.5A3.5 3.5 0 017 8.5V7.5a5 5 0 015-5Zm-6 9.5h12a2 2 0 012 2v1.5a1 1 0 01-1 1H7a1 1 0 01-1-1V14a2 2 0 012-2Zm8 6a3 3 0 003 3H9a3 3 0 003-3Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-600">Create a new password for your TailorPro account.</p>
        </div>

        {message ? (
          <div className="space-y-4 text-center">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#1f6fe9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-200 transition hover:bg-[#195cc6]"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter a new password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#1f6fe9] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-200 transition hover:bg-[#195cc6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
