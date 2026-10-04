// RESTYLED TAILORPRO VERSION — charcoal, sage, ivory and brass palette.
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { apiRequest } from '../service/api'
import { formatName } from '../utils/formatName'

type Unit = 'CM' | 'INCHES'
type MeasurementData = Record<string, number>

type Measurement = {
  id: string
  title: string
  unit: Unit
  data: MeasurementData
  clientId: string
  client?: { id: string; name: string }
}

type MeasurementHistory = {
  id: string
  measurementId: string
  title: string
  unit: Unit
  data: MeasurementData
  recordedAt: string
}

type MeasurementField = { id: string; label: string; value: string }
type Props = { onLogout: () => void }
type ApiEnvelope<T> = { status?: string; data: T }

const fieldClass = 'mt-1.5 w-full rounded-xl border border-[#d8dfda] bg-white px-4 py-3 text-[#263d47] outline-none transition focus:border-[#82998d] focus:ring-4 focus:ring-[#778f83]/10'

function unitLabel(unit: Unit) {
  return unit === 'CM' ? 'cm' : 'in'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeMeasurementData(input: unknown): MeasurementData {
  let candidate: unknown = input

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isObject(candidate)) return {}
    const entries = Object.entries(candidate)
    const normalized: MeasurementData = {}

    for (const [label, value] of entries) {
      if (typeof value === 'number' && Number.isFinite(value)) normalized[label] = value
      else if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) normalized[label] = Number(value)
    }

    if (Object.keys(normalized).length) return normalized
    const nested = entries.filter(([, value]) => isObject(value))
    if (nested.length !== 1) return {}
    candidate = nested[0][1]
  }

  return {}
}

function unwrapMeasurement(response: Measurement | ApiEnvelope<Measurement>) {
  return !('id' in response) && isObject(response.data)
    ? response.data as Measurement
    : response as Measurement
}

function unwrapHistory(response: MeasurementHistory[] | ApiEnvelope<MeasurementHistory[]>) {
  return Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : []
}

function makeFields(data: MeasurementData): MeasurementField[] {
  return Object.entries(data).map(([label, value]) => ({
    id: crypto.randomUUID(),
    label,
    value: String(value),
  }))
}

export default function MeasurementDetailsPage({ onLogout }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const [history, setHistory] = useState<MeasurementHistory[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [unit, setUnit] = useState<Unit>('INCHES')
  const [fields, setFields] = useState<MeasurementField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareId, setShareId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const resetDraft = useCallback((current: Measurement) => {
    setTitle(current.title)
    setUnit(current.unit)
    setFields(makeFields(current.data))
  }, [])

  const loadMeasurement = useCallback(async () => {
    if (!id) {
      setError('Measurement ID is missing.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      const [measurementResponse, historyResponse] = await Promise.all([
        apiRequest<Measurement | ApiEnvelope<Measurement>>(`/measurement/${id}`),
        apiRequest<MeasurementHistory[] | ApiEnvelope<MeasurementHistory[]>>(`/measurement/${id}/history`),
      ])

      const current = unwrapMeasurement(measurementResponse)
      const normalized = { ...current, data: normalizeMeasurementData(current.data) }
      setMeasurement(normalized)
      setHistory(unwrapHistory(historyResponse).map((record) => ({
        ...record,
        data: normalizeMeasurementData(record.data),
      })))
      resetDraft(normalized)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load measurement.'
      setError(message)
      if (message.toLowerCase().includes('session') || message.toLowerCase().includes('unauthorized')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [id, onLogout, resetDraft])

  useEffect(() => { void loadMeasurement() }, [loadMeasurement])

  function startEditing() {
    if (!measurement) return
    resetDraft(measurement)
    setError('')
    setSuccess('')
    setIsEditing(true)
  }

  function cancelEditing() {
    if (measurement) resetDraft(measurement)
    setError('')
    setIsEditing(false)
  }

  function updateField(fieldId: string, property: 'label' | 'value', value: string) {
    setFields((current) => current.map((field) => field.id === fieldId ? { ...field, [property]: value } : field))
  }

  function addField() {
    setFields((current) => [...current, { id: crypto.randomUUID(), label: '', value: '' }])
  }

  function removeField(fieldId: string) {
    setFields((current) => current.filter((field) => field.id !== fieldId))
  }

  async function saveMeasurement() {
    if (!id) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      if (!title.trim()) throw new Error('Enter a title for this measurement.')

      const completed = fields.filter((field) => field.label.trim() && field.value.trim())
      if (!completed.length) throw new Error('Enter at least one measurement.')
      const data: MeasurementData = {}

      for (const field of completed) {
        const label = field.label.trim()
        const value = Number(field.value)
        if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a valid positive number.`)
        if (Object.prototype.hasOwnProperty.call(data, label)) throw new Error(`The field “${label}” appears more than once.`)
        data[label] = value
      }

      await apiRequest(`/measurement/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), unit, data }),
      })
      await loadMeasurement()
      setIsEditing(false)
      setSuccess('Measurement updated. The previous version was saved in history.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update measurement.')
    } finally {
      setSaving(false)
    }
  }

  async function restoreHistory(historyId: string) {
    if (!id || !window.confirm('Restore this older version? The current version will be saved in history.')) return
    try {
      setRestoringId(historyId)
      setError('')
      setSuccess('')
      await apiRequest(`/measurement/${id}/history/${historyId}/restore`, { method: 'POST' })
      await loadMeasurement()
      setIsEditing(false)
      setSuccess('Previous measurement restored successfully.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to restore measurement.')
    } finally {
      setRestoringId(null)
    }
  }

  async function createShareLink() {
    if (!id) return
    try {
      setSharing(true)
      setError('')
      setSuccess('')
      const response = await apiRequest<ApiEnvelope<{ shareId: string; shareUrl: string; expiresAt: string }>>(`/measurement/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 7 }),
      })
      if (!response.data?.shareUrl) throw new Error('The server did not return a share link.')
      setShareId(response.data.shareId)
      setShareUrl(response.data.shareUrl)
      await navigator.clipboard.writeText(response.data.shareUrl)
      setSuccess('Share link created and copied. It expires after seven days.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create share link.')
    } finally {
      setSharing(false)
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setSuccess('Share link copied.')
    } catch {
      setError('Your browser could not copy the link. Select and copy it manually.')
    }
  }

  async function revokeShareLink() {
    if (!id || !shareId || !window.confirm('Revoke this share link? It will stop working immediately.')) return
    try {
      setRevoking(true)
      setError('')
      setSuccess('')
      await apiRequest(`/measurement/${id}/share/${shareId}`, { method: 'DELETE' })
      setShareId('')
      setShareUrl('')
      setSuccess('Share link revoked successfully.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to revoke share link.')
    } finally {
      setRevoking(false)
    }
  }

  async function deleteMeasurement() {
    if (!id || !window.confirm('Delete this measurement and all of its history?')) return
    try {
      setDeleting(true)
      setError('')
      await apiRequest(`/measurement/${id}`, { method: 'DELETE' })
      navigate(`/measurements/client/${measurement?.clientId ?? ''}`, { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete measurement.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <main className="flex min-h-full items-center justify-center p-8"><p className="rounded-2xl bg-white/85 px-6 py-4 font-semibold text-[#69766f] shadow-sm">Loading measurement…</p></main>

  if (!measurement) {
    return (
      <main className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="rounded-2xl bg-white/90 p-8 text-center shadow-[0_12px_35px_rgba(45,58,55,0.08)]">
          <p className="text-red-600">{error || 'Measurement not found.'}</p>
          <Link to="/measurements" className="mt-4 inline-block font-bold text-[#607d6f]">Return to measurements</Link>
        </div>
      </main>
    )
  }

  const currentFields = Object.entries(measurement.data)
  const clientName = formatName(measurement.client?.name) || 'Client'

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-5 rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.07)] backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <Link to={`/measurements/client/${measurement.clientId}`} className="text-sm font-bold text-[#607d6f] hover:text-[#314b43]">← {clientName} measurements</Link>
            <h1 className="mt-2 font-display text-4xl text-[#263d47]">{isEditing ? 'Edit measurement' : measurement.title}</h1>
            <p className="mt-1 text-sm text-[#75817c]">{clientName}</p>
          </div>
          {!isEditing && <button type="button" onClick={startEditing} className="rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#36515b]">Edit measurement</button>}
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-2xl border border-[#bcd8c8] bg-[#eaf5ee] px-4 py-3 text-sm text-[#397153]">{success}</p>}

        {!isEditing ? (
          <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.08)] sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8ece9] pb-5">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#778f83]">Current measurement</p><h2 className="mt-1 font-display text-3xl text-[#263d47]">{measurement.title}</h2></div>
              <span className="rounded-full bg-[#f2ebdc] px-3 py-1 text-sm font-bold text-[#866d40]">{measurement.unit === 'CM' ? 'Centimetres' : 'Inches'}</span>
            </div>

            {currentFields.length ? (
              <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentFields.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#e4e9e5] bg-[#f7f8f5] p-4">
                    <dt className="text-sm text-[#75817c]">{label}</dt>
                    <dd className="mt-1 text-xl font-black text-[#263d47]">{value} <span className="text-sm font-semibold text-[#7c8882]">{unitLabel(measurement.unit)}</span></dd>
                  </div>
                ))}
              </dl>
            ) : <p className="mt-6 rounded-xl bg-[#f5f6f3] p-4 text-sm text-[#75817c]">No measurement fields were recorded.</p>}

            <div className="mt-6 rounded-2xl border border-[#cbd8d0] bg-[#edf2ef] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="font-extrabold text-[#314b43]">Share measurement</h3><p className="text-sm text-[#60766b]">Create a read-only link that expires after seven days.</p></div>
                {!shareUrl && <button type="button" disabled={sharing} onClick={() => void createShareLink()} className="rounded-lg bg-[#263d47] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{sharing ? 'Creating…' : 'Create share link'}</button>}
              </div>
              {shareUrl && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={shareUrl} aria-label="Shareable measurement link" className="min-w-0 flex-1 rounded-lg border border-[#c8d4cd] bg-white px-3 py-2 text-sm text-[#4e5e57]" />
                  <button type="button" onClick={() => void copyShareLink()} className="rounded-lg bg-[#263d47] px-4 py-2 text-sm font-bold text-white">Copy</button>
                  <button type="button" disabled={revoking} onClick={() => void revokeShareLink()} className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50">{revoking ? 'Revoking…' : 'Revoke'}</button>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end"><button type="button" disabled={deleting} onClick={() => void deleteMeasurement()} className="rounded-xl border border-red-300 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete measurement'}</button></div>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.08)] sm:p-7">
            <h2 className="font-display text-2xl text-[#263d47]">Update measurement</h2>
            <p className="mt-1 text-sm text-[#75817c]">Saving creates a history copy of the current values.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#4e5e57]">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} /></label>
              <label className="text-sm font-bold text-[#4e5e57]">Unit<select value={unit} onChange={(event) => setUnit(event.target.value as Unit)} className={fieldClass}><option value="INCHES">Inches</option><option value="CM">Centimetres</option></select></label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div><h3 className="font-extrabold text-[#263d47]">Measurement fields</h3><p className="text-xs text-[#75817c]">Add, rename or remove any field.</p></div>
              <button type="button" onClick={addField} className="rounded-lg border border-[#c8d4cd] bg-[#edf2ef] px-3 py-2 text-sm font-bold text-[#49675a]">+ Add custom field</button>
            </div>

            <div className="mt-4 space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="grid grid-cols-1 gap-2 rounded-xl border border-[#e6eae7] bg-[#f8f9f6] p-3 sm:grid-cols-[1fr_140px_auto]">
                  <input value={field.label} onChange={(event) => updateField(field.id, 'label', event.target.value)} placeholder="Measurement name" aria-label="Measurement name" className="rounded-xl border border-[#d8dfda] bg-white px-3 py-2 outline-none focus:border-[#82998d]" />
                  <div className="relative"><input type="number" min="0" step="0.1" value={field.value} onChange={(event) => updateField(field.id, 'value', event.target.value)} aria-label={`${field.label || 'Measurement'} value`} className="w-full rounded-xl border border-[#d8dfda] bg-white px-3 py-2 pr-10 outline-none focus:border-[#82998d]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a938f]">{unitLabel(unit)}</span></div>
                  <button type="button" onClick={() => removeField(field.id)} className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Remove</button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" disabled={saving} onClick={cancelEditing} className="rounded-xl border border-[#d4dad6] px-5 py-3 font-bold text-[#596861] hover:bg-[#f0f3f0] disabled:opacity-60">Cancel</button>
              <button type="button" disabled={saving} onClick={() => void saveMeasurement()} className="rounded-xl bg-[#263d47] px-5 py-3 font-bold text-white hover:bg-[#36515b] disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.08)] sm:p-7">
          <h2 className="font-display text-2xl text-[#263d47]">Measurement history</h2>
          <p className="mt-1 text-sm text-[#75817c]">Older versions are saved whenever the current measurement is updated.</p>
          <div className="mt-5 space-y-4">
            {!history.length ? <p className="rounded-xl bg-[#f5f6f3] p-4 text-sm text-[#75817c]">There are no previous versions yet.</p> : history.map((record) => (
              <article key={record.id} className="rounded-xl border border-[#e1e6e2] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-extrabold text-[#263d47]">{record.title}</h3><p className="mt-1 text-xs text-[#7c8882]">Saved {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.recordedAt))}</p></div>
                  <button type="button" disabled={restoringId === record.id} onClick={() => void restoreHistory(record.id)} className="rounded-lg border border-[#9eb2a7] bg-[#edf2ef] px-3 py-2 text-sm font-bold text-[#49675a] disabled:opacity-50">{restoringId === record.id ? 'Restoring…' : 'Restore version'}</button>
                </div>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Object.entries(record.data).map(([label, value]) => <div key={label} className="flex justify-between rounded-lg bg-[#f7f8f5] px-3 py-2 text-sm"><dt className="text-[#66736d]">{label}</dt><dd className="font-bold text-[#263d47]">{value} {unitLabel(record.unit)}</dd></div>)}
                </dl>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
