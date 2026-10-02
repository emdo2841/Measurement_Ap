import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { apiRequest } from '../service/api'

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

type MeasurementField = {
  id: string
  label: string
  value: string
}

type Props = {
  onLogout: () => void
}

type ApiEnvelope<T> = {
  status?: string
  data: T
}

function unitLabel(unit: Unit) {
  return unit === 'CM' ? 'cm' : 'in'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Older records can contain a double-nested JSON value such as:
 * { data: { Waist: 30, Hip: 40 } }
 *
 * This converts both that shape and the desired flat shape into:
 * { Waist: 30, Hip: 40 }
 */
function normalizeMeasurementData(input: unknown): MeasurementData {
  let candidate: unknown = input

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isObject(candidate)) return {}

    const entries = Object.entries(candidate)
    const normalized: MeasurementData = {}

    for (const [label, value] of entries) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        normalized[label] = value
        continue
      }

      if (
        typeof value === 'string' &&
        value.trim() !== '' &&
        Number.isFinite(Number(value))
      ) {
        normalized[label] = Number(value)
      }
    }

    if (Object.keys(normalized).length > 0) return normalized

    const nestedObjects = entries.filter(([, value]) => isObject(value))

    // Only unwrap when there is one obvious nested measurement object.
    if (nestedObjects.length !== 1) return {}

    candidate = nestedObjects[0][1]
  }

  return {}
}

function normalizeMeasurement(input: Measurement): Measurement {
  return {
    ...input,
    data: normalizeMeasurementData(input.data),
  }
}

function unwrapMeasurementResponse(
  response: Measurement | ApiEnvelope<Measurement>,
): Measurement {
  if (
    !('id' in response) &&
    isObject(response.data) &&
    'id' in response.data &&
    'title' in response.data
  ) {
    return response.data as Measurement
  }

  return response as Measurement
}

function unwrapHistoryResponse(
  response: MeasurementHistory[] | ApiEnvelope<MeasurementHistory[]>,
): MeasurementHistory[] {
  if (Array.isArray(response)) return response
  return Array.isArray(response.data) ? response.data : []
}

function makeFields(data: MeasurementData): MeasurementField[] {
  return Object.entries(data ?? {}).map(([label, value]) => ({
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

  // Editing is deliberately off when the details page opens.
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [unit, setUnit] = useState<Unit>('INCHES')
  const [fields, setFields] = useState<MeasurementField[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
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

      const [currentMeasurementResponse, historyResponse] = await Promise.all([
        apiRequest<Measurement | ApiEnvelope<Measurement>>(
          `/measurement/${id}`,
        ),
        apiRequest<
          MeasurementHistory[] | ApiEnvelope<MeasurementHistory[]>
        >(`/measurement/${id}/history`),
      ])

      const currentMeasurement = normalizeMeasurement(
        unwrapMeasurementResponse(currentMeasurementResponse),
      )

      const historyRecords = unwrapHistoryResponse(historyResponse)

      setMeasurement(currentMeasurement)
      setHistory(
        Array.isArray(historyRecords)
          ? historyRecords.map((record) => ({
              ...record,
              data: normalizeMeasurementData(record.data),
            }))
          : [],
      )
      resetDraft(currentMeasurement)
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Unable to load measurement.'

      setError(message)

      if (
        message.toLowerCase().includes('session') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        onLogout()
      }
    } finally {
      setLoading(false)
    }
  }, [id, onLogout, resetDraft])

  useEffect(() => {
    void loadMeasurement()
  }, [loadMeasurement])

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

  function updateField(
    fieldId: string,
    property: 'label' | 'value',
    value: string,
  ) {
    setFields((current) =>
      current.map((field) =>
        field.id === fieldId ? { ...field, [property]: value } : field,
      ),
    )
  }

  function addField() {
    setFields((current) => [
      ...current,
      { id: crypto.randomUUID(), label: '', value: '' },
    ])
  }

  function removeField(fieldId: string) {
    setFields((current) =>
      current.filter((field) => field.id !== fieldId),
    )
  }

  async function saveMeasurement() {
    if (!id) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!title.trim()) {
        throw new Error('Enter a title for this measurement.')
      }

      const completed = fields.filter(
        (field) => field.label.trim() && field.value.trim(),
      )

      if (!completed.length) {
        throw new Error('Enter at least one measurement.')
      }

      const data: Record<string, number> = {}

      for (const field of completed) {
        const label = field.label.trim()
        const value = Number(field.value)

        if (!Number.isFinite(value) || value < 0) {
          throw new Error(`${label} must be a valid positive number.`)
        }

        if (Object.prototype.hasOwnProperty.call(data, label)) {
          throw new Error(`The field “${label}” appears more than once.`)
        }

        data[label] = value
      }

      await apiRequest(`/measurement/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), unit, data }),
      })

      await loadMeasurement()
      setIsEditing(false)
      setSuccess(
        'Measurement updated. The previous version was saved in history.',
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to update measurement.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function restoreHistory(historyId: string) {
    if (
      !id ||
      !window.confirm(
        'Restore this older version? The current version will be saved in history.',
      )
    ) {
      return
    }

    try {
      setRestoringId(historyId)
      setError('')
      setSuccess('')

      await apiRequest(
        `/measurement/${id}/history/${historyId}/restore`,
        { method: 'POST' },
      )

      await loadMeasurement()
      setIsEditing(false)
      setSuccess('Previous measurement restored successfully.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to restore measurement.',
      )
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

    const result = await apiRequest<
      ApiEnvelope<{
        shareId: string
        shareUrl: string
        expiresAt: string
      }>
    >(`/measurement/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expiresInDays: 7,
      }),
    })

    const createdShare = result.data

    if (!createdShare?.shareUrl) {
      throw new Error('The server did not return a share link.')
    }

    setShareId(createdShare.shareId)
    setShareUrl(createdShare.shareUrl)

    await navigator.clipboard.writeText(
      createdShare.shareUrl,
    )

    setSuccess(
      'Share link created and copied. It expires after seven days.',
    )
  } catch (cause) {
    setError(
      cause instanceof Error
        ? cause.message
        : 'Unable to create share link.',
    )
  } finally {
    setSharing(false)
  }
}

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setSuccess('Share link copied.')
    } catch {
      setError(
        'Your browser could not copy the link. Select and copy it manually.',
      )
    }
  }

  async function revokeShareLink() {
    if (
      !id ||
      !shareId ||
      !window.confirm(
        'Revoke this share link? It will stop working immediately.',
      )
    ) {
      return
    }

    try {
      setError('')
      setSuccess('')

      await apiRequest(`/measurement/${id}/share/${shareId}`, {
        method: 'DELETE',
      })

      setShareId('')
      setShareUrl('')
      setSuccess('Share link revoked successfully.')
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to revoke share link.',
      )
    }
  }

  async function deleteMeasurement() {
    if (
      !id ||
      !window.confirm('Delete this measurement and all of its history?')
    ) {
      return
    }

    try {
      await apiRequest(`/measurement/${id}`, { method: 'DELETE' })
       navigate(`/measurements/client/${measurement?.clientId ?? ''}`, { replace: true })
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Unable to delete measurement.',
      )
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="rounded-xl bg-white px-6 py-4 shadow-sm">
          Loading measurement...
        </p>
      </main>
    )
  }

  if (!measurement) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">
            {error || 'Measurement not found.'}
          </p>
          <Link
            to="/measurements"
            className="mt-4 inline-block font-semibold text-blue-600"
          >
            Return to measurements
          </Link>
        </div>
      </main>
    )
  }

  const currentFields = Object.entries(measurement.data ?? {})

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to={`/measurements/client/${measurement.clientId}`}
               className="text-sm font-semibold text-blue-600 hover:text-blue-700"
             >
              ← {measurement.client?.name ?? 'Client'} measurements
             </Link>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              {isEditing ? 'Edit measurement' : measurement.title}
            </h1>

            <p className="mt-1 text-slate-500">
              {measurement.client?.name ?? 'Client measurement'}
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Edit measurement
            </button>
          )}
        </header>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        {!isEditing ? (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Current measurement
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {measurement.title}
                </h2>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                {measurement.unit === 'CM' ? 'Centimetres' : 'Inches'}
              </span>
            </div>

            {currentFields.length ? (
              <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentFields.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="mt-1 text-xl font-bold text-slate-900">
                      {value}{' '}
                      <span className="text-sm font-medium text-slate-500">
                        {unitLabel(measurement.unit)}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No measurement fields were recorded.
              </p>
            )}

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Share measurement
                  </h3>
                  <p className="text-sm text-blue-700">
                    Create a read-only link that expires after seven days.
                  </p>
                </div>

                {!shareUrl && (
                  <button
                    type="button"
                    disabled={sharing}
                    onClick={() => void createShareLink()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {sharing ? 'Creating...' : 'Create share link'}
                  </button>
                )}
              </div>

              {shareUrl && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    readOnly
                    value={shareUrl}
                    aria-label="Shareable measurement link"
                    className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void copyShareLink()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => void revokeShareLink()}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600"
                  >
                    Revoke
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void deleteMeasurement()}
                className="rounded-xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete measurement
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">Update measurement</h2>
            <p className="mt-1 text-sm text-slate-500">
              Saving creates a history copy of the current values.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="text-sm font-medium">
                Unit
                <select
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as Unit)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="INCHES">Inches</option>
                  <option value="CM">Centimetres</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Measurement fields</h3>
                <p className="text-xs text-slate-500">
                  Add, rename or remove any field.
                </p>
              </div>

              <button
                type="button"
                onClick={addField}
                className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
              >
                Add custom field
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto]"
                >
                  <input
                    value={field.label}
                    onChange={(event) =>
                      updateField(field.id, 'label', event.target.value)
                    }
                    placeholder="Measurement name"
                    aria-label="Measurement name"
                    className="rounded-xl border border-slate-300 px-3 py-2"
                  />

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={field.value}
                      onChange={(event) =>
                        updateField(field.id, 'value', event.target.value)
                      }
                      aria-label={`${field.label || 'Measurement'} value`}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      {unitLabel(unit)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void saveMeasurement()}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Measurement history</h2>
          <p className="mt-1 text-sm text-slate-500">
            Older versions are saved whenever the current measurement is
            updated.
          </p>

          <div className="mt-5 space-y-4">
            {!history.length ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                There are no previous versions yet.
              </p>
            ) : (
              history.map((record) => (
                <article
                  key={record.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{record.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Saved{' '}
                        {new Intl.DateTimeFormat('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(record.recordedAt))}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={restoringId === record.id}
                      onClick={() => void restoreHistory(record.id)}
                      className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 disabled:opacity-50"
                    >
                      {restoringId === record.id
                        ? 'Restoring...'
                        : 'Restore version'}
                    </button>
                  </div>

                  <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                    {Object.entries(record.data).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <dt className="text-slate-600">{label}</dt>
                        <dd className="font-bold">
                          {value} {unitLabel(record.unit)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
