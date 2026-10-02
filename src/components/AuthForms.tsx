import { useState } from 'react'
import type { RefObject } from 'react'

type AuthMode = 'login' | 'signup'

type AuthFormsProps = {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onSubmit: (payload: { email: string; password: string; name?: string; phone?: string; registrationToken?: string }) => Promise<void>
  isSubmitting: boolean
  error?: string
  googleButtonRef: RefObject<HTMLDivElement | null>
  onForgotPassword?: (email: string) => Promise<void> | void
  onRequestRegistrationCode?: (email: string) => Promise<void>
  onVerifyRegistrationCode?: (email: string, code: string) => Promise<string>
}

export function LoginForm({
  onModeChange,
  onSubmit,
  isSubmitting,
  error,
  googleButtonRef,
  onForgotPassword,
}: Omit<AuthFormsProps, 'mode'>) {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleForgotPasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onForgotPassword) return

    setSendingReset(true)
    setForgotPasswordMessage('')

    try {
      await onForgotPassword(forgotEmail)
      setForgotPasswordMessage('A password reset link has been sent to your email.')
      setForgotEmail('')
    } catch (err) {
      setForgotPasswordMessage(err instanceof Error ? err.message : 'Unable to send reset link.')
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#e8e1db]">
      <div className="mx-auto flex min-h-screen max-w-375 items-stretch bg-[#f4f3f2]">
        <div className="relative hidden w-[70%] overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/login%20and%20reg.jpg')" }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/15 to-black/10" />

          <div className="absolute inset-x-0 bottom-0 z-10 p-8 text-white xl:p-10">
            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.06em] text-white xl:text-5xl">
              Craft Your Vision
            </h1>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tighter text-white xl:text-4xl">
              TailorPro: Measure, Create, Deliver
            </h2>
            <p className="mt-4 text-base text-white/85 xl:text-lg">Login to access your workshop and orders.</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-[#f5f3f2] px-2.5 py-3 lg:w-[30%] lg:px-3 xl:px-4">
          <div className="w-full max-w-75">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f6fe9] shadow-md shadow-blue-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                    <path d="M12 2.5a5 5 0 015 5v1.5A3.5 3.5 0 0113.5 12H10.5A3.5 3.5 0 017 8.5V7.5a5 5 0 015-5Zm-6 9.5h12a2 2 0 012 2v1.5a1 1 0 01-1 1H7a1 1 0 01-1-1V14a2 2 0 012-2Zm8 6a3 3 0 003 3H9a3 3 0 003-3Z" />
                  </svg>
                </div>
                <div className="text-[17px] font-bold text-slate-900">TailorPro</div>
              </div>

              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-700">Welcome</div>
            </div>

            <div className="mb-2.5">
              <h3 className="text-[22px] font-black leading-tight tracking-tighter text-slate-900 xl:text-[26px]">
                Login to Your Account
              </h3>
              <p className="mt-1 text-xs text-slate-500">Please enter your details to continue.</p>
            </div>

            <form
              className="space-y-2.5"
              onSubmit={async (event) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                const email = String(formData.get('email') ?? '')
                const password = String(formData.get('password') ?? '')
                await onSubmit({ email, password })
              }}
            >
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">Email Address</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-slate-400 stroke-2">
                    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" strokeLinejoin="round" />
                    <path d="m5 7 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    required
                  />
                </div>
              </div>


              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword((previous) => !previous)
                      setForgotPasswordMessage('')
                    }}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
                    aria-expanded={showForgotPassword}
                  >
                    {showForgotPassword ? 'Cancel' : 'Forgot Password?'}
                  </button>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 fill-none stroke-slate-400 stroke-2"
                  >
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
                  </svg>

                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="shrink-0 rounded-md px-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  Remember me
                </label>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl bg-[#1f6fe9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-200 transition hover:bg-[#195cc6] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {showForgotPassword && (
              <form onSubmit={handleForgotPasswordSubmit} className="mb-2 rounded-xl border border-blue-100 bg-blue-50 p-2.5">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-700">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={sendingReset}
                    className="rounded-lg bg-[#1f6fe9] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sendingReset ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {forgotPasswordMessage && <p className="mt-2 text-[10px] text-slate-600">{forgotPasswordMessage}</p>}
              </form>
            )}

            <div className="mt-2.5 text-center text-[11px] text-slate-600">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange('signup')}
                className="font-semibold text-[#1f6fe9] underline-offset-2 hover:underline"
              >
                Sign Up
              </button>
            </div>

            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div ref={googleButtonRef} className="flex min-h-10 justify-center" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SignupForm({
  onModeChange,
  onSubmit,
  isSubmitting,
  error,
  googleButtonRef,
  onRequestRegistrationCode,
  onVerifyRegistrationCode,
}: Omit<AuthFormsProps, 'mode'>) {
  const [step, setStep] = useState<'email' | 'code' | 'details'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [registrationToken, setRegistrationToken] = useState('')
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onRequestRegistrationCode) return
    try {
      setWorking(true); setMessage('')
      await onRequestRegistrationCode(email)
      setStep('code')
      setMessage('We sent a six-digit code to your email. It expires in 10 minutes.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not send verification code.')
    } finally { setWorking(false) }
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onVerifyRegistrationCode) return
    try {
      setWorking(true); setMessage('')
      const token = await onVerifyRegistrationCode(email, code)
      setRegistrationToken(token)
      setStep('details')
      setMessage('Email verified. Complete your account details.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not verify code.')
    } finally { setWorking(false) }
  }

  async function resendCode() {
    if (!onRequestRegistrationCode) return
    try {
      setWorking(true); setMessage('')
      await onRequestRegistrationCode(email)
      setMessage('A new verification code was sent.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Could not resend verification code.')
    } finally { setWorking(false) }
  }

  return (
    <div className="min-h-screen bg-[#e8e1db]">
      <div className="mx-auto flex min-h-screen max-w-375 items-stretch bg-[#f4f3f2]">
        <div className="relative hidden w-[70%] overflow-hidden lg:block">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/login%20and%20reg.jpg')" }} />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/15 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 z-10 p-8 text-white xl:p-10">
            <h1 className="text-4xl font-black tracking-[-0.06em] xl:text-5xl">Craft Your Vision</h1>
            <h2 className="mt-3 text-3xl font-black tracking-tighter xl:text-4xl">TailorPro: Measure, Create, Deliver</h2>
            <p className="mt-4 text-white/85">Create your account to begin managing orders.</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-[#f5f3f2] px-4 py-6 lg:w-[30%]">
          <div className="w-full max-w-80">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-[17px] font-bold text-slate-900">TailorPro</div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-700">Create</div>
            </div>
            <h3 className="text-[24px] font-black tracking-tighter text-slate-900">
              {step === 'email' ? 'Verify Your Email' : step === 'code' ? 'Enter Verification Code' : 'Complete Your Account'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {step === 'email' ? 'Start by entering the email you want to use.' : step === 'code' ? `Enter the code sent to ${email}.` : `Verified email: ${email}`}
            </p>

            {step === 'email' && <form onSubmit={sendCode} className="mt-5 space-y-3">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required />
              <button disabled={working} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{working ? 'Sending...' : 'Send verification code'}</button>
            </form>}

            {step === 'code' && <form onSubmit={verifyCode} className="mt-5 space-y-3">
              <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] outline-none focus:border-blue-500" required />
              <button disabled={working || code.length !== 6} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{working ? 'Checking...' : 'Verify code'}</button>
              <div className="flex justify-between text-xs"><button type="button" onClick={() => { setStep('email'); setCode(''); setMessage('') }} className="text-slate-600">Change email</button><button type="button" disabled={working} onClick={() => void resendCode()} className="font-semibold text-blue-600">Resend code</button></div>
            </form>}

            {step === 'details' && <form className="mt-5 space-y-3" onSubmit={async (event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              await onSubmit({ email, registrationToken, name: String(data.get('name') ?? ''), phone: String(data.get('phone') ?? ''), password: String(data.get('password') ?? '') })
            }}>
              <input name="name" placeholder="Full name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" required />
              <input name="phone" type="tel" placeholder="Phone number" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3" required />
              <div className="flex rounded-xl border border-slate-200 bg-white px-4 py-3">
                <input name="password" type={showPassword ? 'text' : 'password'} minLength={8} placeholder="Create password" className="min-w-0 flex-1 outline-none" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-xs font-semibold text-blue-600">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              <button disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Creating...' : 'Create account'}</button>
            </form>}

            {(message || error) && <p className={`mt-3 text-xs ${error ? 'text-red-600' : 'text-slate-600'}`}>{error || message}</p>}
            <div className="my-4 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-400">or</span><div className="h-px flex-1 bg-slate-200" /></div>
            <div ref={googleButtonRef} className="flex min-h-10 justify-center" />
            <div className="mt-3 text-center text-xs text-slate-600">Already have an account? <button type="button" onClick={() => onModeChange('login')} className="font-semibold text-blue-600">Sign in</button></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LegacySignupForm({
  onModeChange,
  onSubmit,
  isSubmitting,
  error,
  googleButtonRef,
}: Omit<AuthFormsProps, 'mode'>) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="min-h-screen bg-[#e8e1db]">
      <div className="mx-auto flex min-h-screen max-w-375 items-stretch bg-[#f4f3f2]">
        <div className="relative hidden w-[70%] overflow-hidden lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/login%20and%20reg.jpg')" }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/15 to-black/10" />

          <div className="absolute inset-x-0 bottom-0 z-10 p-8 text-white xl:p-10">
            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.06em] text-white xl:text-5xl">
              Craft Your Vision
            </h1>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tighter text-white xl:text-4xl">
              TailorPro: Measure, Create, Deliver
            </h2>
            <p className="mt-4 text-base text-white/85 xl:text-lg">Create your account to begin managing orders.</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-[#f5f3f2] px-2.5 py-3 lg:w-[30%] lg:px-3 xl:px-4">
          <div className="w-full max-w-75">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f6fe9] shadow-md shadow-blue-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                    <path d="M12 2.5a5 5 0 015 5v1.5A3.5 3.5 0 0113.5 12H10.5A3.5 3.5 0 017 8.5V7.5a5 5 0 015-5Zm-6 9.5h12a2 2 0 012 2v1.5a1 1 0 01-1 1H7a1 1 0 01-1-1V14a2 2 0 012-2Zm8 6a3 3 0 003 3H9a3 3 0 003-3Z" />
                  </svg>
                </div>
                <div className="text-[17px] font-bold text-slate-900">TailorPro</div>
              </div>

              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-700">Create</div>
            </div>

            <div className="mb-2.5">
              <h3 className="text-[22px] font-black leading-tight tracking-tighter text-slate-900 xl:text-[26px]">
                Create Your Account
              </h3>
              <p className="mt-1 text-xs text-slate-500">Please enter your details to get started.</p>
            </div>

            <form
              className="space-y-2.5"
              onSubmit={async (event) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                const name = String(formData.get('name') ?? '')
                const email = String(formData.get('email') ?? '')
                const phone = String(formData.get('phone') ?? '')
                const password = String(formData.get('password') ?? '')
                await onSubmit({ name, email, phone, password })
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">First Name</label>
                  <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                      name="name"
                      type="text"
                      placeholder="John"
                      className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">Phone</label>
                  <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+234..."
                      className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-700">Email Address</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-slate-400 stroke-2">
                    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" strokeLinejoin="round" />
                    <path d="m5 7 7 5 7-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 shadow-sm transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0 fill-none stroke-slate-400 stroke-2"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
                </svg>

                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  className="min-w-0 flex-1 bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="shrink-0 rounded-md px-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-xl bg-[#1f6fe9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue-200 transition hover:bg-[#195cc6] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div ref={googleButtonRef} className="flex min-h-10 justify-center" />

            <div className="mt-2.5 text-center text-[11px] text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange('login')}
                className="font-semibold text-[#1f6fe9] underline-offset-2 hover:underline"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
