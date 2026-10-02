import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest } from '../../service/api'

type EditableClient = {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  gender?: string | null
  image?: string | null
}

type ClientFormProps = {
  client?: EditableClient
  onSaved: () => Promise<void> | void
  onCancel: () => void
}

export default function ClientForm({
  client,
  onSaved,
  onCancel,
}: ClientFormProps) {
  const editing = Boolean(client)

  const [form, setForm] = useState({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    address: client?.address ?? '',
    gender: client?.gender ?? 'FEMALE',
  })

  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState(client?.image ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function selectImage(file: File | null) {
    setImage(file)

    if (!file) {
      setPreview(client?.image ?? '')
      return
    }

    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const data = new FormData()
      data.append('name', form.name.trim())
      data.append('phone', form.phone.trim())
      data.append('gender', form.gender)

      if (form.email.trim()) data.append('email', form.email.trim())
      if (form.address.trim()) data.append('address', form.address.trim())
      if (image) data.append('image', image)

      await apiRequest(editing ? `/clients/${client!.id}` : '/clients', {
        method: editing ? 'PATCH' : 'POST',
        body: data,
      })

      await onSaved()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : `Unable to ${editing ? 'update' : 'create'} client.`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Full name
          <input
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Client's full name"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Phone number
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="+234..."
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Email address
        <input
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="client@example.com (optional)"
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Address
        <textarea
          value={form.address}
          onChange={(event) => updateField('address', event.target.value)}
          placeholder="Client's address (optional)"
          rows={3}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Gender
        <select
          value={form.gender}
          onChange={(event) => updateField('gender', event.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        >
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
          <option value="OTHER">Other</option>
        </select>
      </label>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Client image
        </label>

        <div className="mt-2 flex items-center gap-4">
          {preview ? (
            <img
              src={preview}
              alt="Client preview"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
              No image
            </div>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? editing
              ? 'Saving...'
              : 'Creating...'
            : editing
              ? 'Save changes'
              : 'Create client'}
        </button>
      </div>
    </form>
  )
}
