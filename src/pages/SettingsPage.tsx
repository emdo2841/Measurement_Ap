import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import NotificationSettings from '../components/settings/NotificationSettings'
import { useToast } from '../components/toast/ToastProvider'
import { apiRequest } from '../service/api'

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
  if (typeof payload !== 'object' || payload === null) throw new Error('Invalid profile response.')
  const wrapped = payload as { data?: unknown }
  return (wrapped.data ?? payload) as UserProfile
}

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

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const loaded = unwrapProfile(await apiRequest('/users/profile'))
      setProfile(loaded)
      setName(loaded.name)
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

  function chooseImage(file: File | null) {
    setImage(file)
    if (file) setPreview(URL.createObjectURL(file))
    else setPreview(profile?.image ?? '')
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return

    try {
      setSaving(true)
      setError('')
      const body = new FormData()
      body.append('name', name.trim())
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

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><p>Loading profile...</p></main>

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Account</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Profile settings</h1>
        <p className="mt-2 text-slate-500">Update the personal information shown on your TailorPro account.</p>
      </header>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          {preview ? <img src={preview} alt="Profile preview" className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-black text-blue-700">{name.charAt(0).toUpperCase() || 'T'}</div>}
          <div>
            <label className="block text-sm font-semibold text-slate-700">Profile picture</label>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} className="mt-2 block max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700" />
            <p className="mt-2 text-xs text-slate-500">Use a JPEG, PNG or WebP image.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Full name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" required /></label>
          <label className="text-sm font-medium text-slate-700">Phone number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234..." className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">Email address<input value={profile?.email ?? ''} readOnly className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500" /><span className="mt-1 block text-xs font-normal text-slate-500">Email changes are disabled because this address is connected to authentication.</span></label>
        </div>

        <div className="mt-7 flex justify-end"><button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button></div>
      </form>

      <NotificationSettings />
    </main>
  )
}
