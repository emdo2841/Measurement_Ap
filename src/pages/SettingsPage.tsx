import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import NotificationSettings from '../components/settings/NotificationSettings'
import { useToast } from '../components/toast/ToastProvider'
import { apiRequest } from '../service/api'
import { formatName } from '../utils/formatName'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
  image?: string | null
  createdAt?: string
}

type SettingsPageProps = { onLogout: () => void }

function unwrapProfile(payload: unknown): UserProfile {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid profile response.')
  }
  const wrapped = payload as { data?: unknown }
  return (wrapped.data ?? payload) as UserProfile
}

const fieldClass = 'mt-1.5 w-full rounded-xl border border-[#d8dfda] bg-white px-4 py-3 text-[#263d47] outline-none transition focus:border-[#82998d] focus:ring-4 focus:ring-[#778f83]/10'

export default function SettingsPage({ onLogout }: SettingsPageProps) {
  const { showToast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const loaded = unwrapProfile(await apiRequest('/users/profile'))
      setProfile(loaded)
      setName(formatName(loaded.name))
      setPhone(loaded.phone ?? '')
      setPreview(loaded.image ?? '')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load your profile.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => { void loadProfile() }, [loadProfile])

  useEffect(() => {
    return () => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function chooseImage(file: File | null) {
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : profile?.image ?? '')
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return

    try {
      setSaving(true)
      setError('')
      const body = new FormData()
      body.append('name', formatName(name))
      if (phone.trim()) body.append('phone', phone.trim())
      if (image) body.append('image', image)

      await apiRequest(`/users/${profile.id}`, { method: 'PATCH', body })
      setImage(null)
      showToast('Profile updated successfully.', 'success')
      await loadProfile()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to update your profile.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      showToast('The new passwords do not match.', 'error')
      return
    }

    try {
      setChangingPassword(true)
      setError('')
      await apiRequest('/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      showToast('Password changed. Please sign in again.', 'success')
      onLogout()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to change your password.'
      setError(message)
      showToast(message, 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><p className="text-center font-semibold text-[#69766f]">Loading profile…</p></main>

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.07)] backdrop-blur-sm sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#778f83]">Account</p>
        <h1 className="mt-1 font-display text-4xl text-[#263d47]">Profile settings</h1>
        <p className="mt-2 text-sm text-[#75817c]">Update the personal information shown on your TailorPro account.</p>
      </header>

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={saveProfile} className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.08)] sm:p-7">
        <div className="flex flex-col gap-5 border-b border-[#e8ece9] pb-6 sm:flex-row sm:items-center">
          {preview ? (
            <img src={preview} alt="Profile preview" className="h-24 w-24 rounded-full object-cover ring-4 ring-[#edf1ed]" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#dfe7e2] text-3xl font-black text-[#314b43] ring-4 ring-white">{formatName(name).charAt(0) || 'T'}</div>
          )}
          <div>
            <label className="block text-sm font-bold text-[#4e5e57]">Profile picture</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} className="mt-2 block max-w-full text-sm text-[#68756f] file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf2ef] file:px-4 file:py-2 file:font-bold file:text-[#49675a]" />
            <p className="mt-2 text-xs text-[#7c8882]">Use a JPEG, PNG or WebP image.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#4e5e57]">Full name<input value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} required /></label>
          <label className="text-sm font-bold text-[#4e5e57]">Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234..." className={fieldClass} /></label>
          <label className="text-sm font-bold text-[#4e5e57] sm:col-span-2">Email address<input value={profile?.email ?? ''} readOnly className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-[#e0e4e1] bg-[#f3f4f1] px-4 py-3 text-[#7a8580]" /><span className="mt-1.5 block text-xs font-normal text-[#7c8882]">Email changes are disabled because this address is connected to authentication.</span></label>
        </div>
        <div className="mt-7 flex justify-end"><button type="submit" disabled={saving} className="rounded-xl bg-[#263d47] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#36515b] disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button></div>
      </form>

      <form onSubmit={changePassword} className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.08)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-display text-2xl text-[#263d47]">Change password</h2><p className="mt-1 text-sm text-[#75817c]">Enter your current password before choosing a new one. Google-only accounts do not need a password.</p></div>
          <button type="button" onClick={() => setShowPasswords((current) => !current)} className="rounded-lg border border-[#d6dcd8] px-3 py-2 text-xs font-bold text-[#596861] hover:bg-[#f0f3f0]">{showPasswords ? 'Hide passwords' : 'Show passwords'}</button>
        </div>
        <div className="mt-6 grid gap-5">
          <label className="text-sm font-bold text-[#4e5e57]">Current password<input type={showPasswords ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClass} required /></label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-bold text-[#4e5e57]">New password<input type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} required /></label>
            <label className="text-sm font-bold text-[#4e5e57]">Confirm new password<input type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldClass} required /></label>
          </div>
        </div>
        <div className="mt-7 flex justify-end"><button type="submit" disabled={changingPassword} className="rounded-xl bg-[#263d47] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#36515b] disabled:opacity-60">{changingPassword ? 'Changing…' : 'Change password'}</button></div>
      </form>

      <NotificationSettings />
    </main>
  )
}
