import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest } from '../../service/api'

type ClientOption = {
  id: string
  name: string
  phone: string
}

type MeasurementField = {
  id: string
  label: string
  value: string
}

type MeasurementFormProps = {
  clients: ClientOption[]
  onCreated: () => Promise<void> | void
  onCancel: () => void
}

const starterFields = ['Bust', 'Waist', 'Hip', 'Shoulder', 'Sleeve length']

function newField(label = ''): MeasurementField {
  return {
    id: crypto.randomUUID(),
    label,
    value: '',
  }
}

export default function MeasurementForm({
  clients,
  onCreated,
  onCancel,
}: MeasurementFormProps) {
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [unit, setUnit] = useState<'CM' | 'INCHES'>('INCHES')
  const [fields, setFields] = useState<MeasurementField[]>(
    starterFields.map((label) => newField(label)),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  function removeField(fieldId: string) {
    setFields((current) => current.filter((field) => field.id !== fieldId))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const measurementData: Record<string, number> = {}

      for (const field of fields) {
        const label = field.label.trim()
        const value = field.value.trim()

        if (!label && !value) continue
        if (!label) throw new Error('Every measurement value needs a name.')
        if (!value) throw new Error(`Enter a value for ${label}.`)

        const numericValue = Number(value)
        if (!Number.isFinite(numericValue) || numericValue < 0) {
          throw new Error(`${label} must contain a valid positive number.`)
        }

        measurementData[label] = numericValue
      }

      if (Object.keys(measurementData).length === 0) {
        throw new Error('Add at least one measurement value.')
      }

      await apiRequest('/measurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, title: title.trim(), unit, data: measurementData }),
      })

      await onCreated()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to save measurement.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Client
          <select
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} — {client.phone}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Measurement title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Current body measurement"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Unit
          <select
            value={unit}
            onChange={(event) => setUnit(event.target.value as 'CM' | 'INCHES')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="INCHES">Inches</option>
            <option value="CM">Centimetres</option>
          </select>
        </label>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Measurement values</h3>
            <p className="text-xs text-slate-500">
              Type a measurement name and its value. No JSON is required.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFields((current) => [...current, newField()])}
            className="rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            + Add field
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
              <input
                value={field.label}
                onChange={(event) => updateField(field.id, 'label', event.target.value)}
                placeholder={`Measurement ${index + 1}`}
                aria-label={`Measurement ${index + 1} name`}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={field.value}
                  onChange={(event) => updateField(field.id, 'value', event.target.value)}
                  placeholder="0"
                  aria-label={`${field.label || `Measurement ${index + 1}`} value`}
                  className="min-w-0 flex-1 px-3 py-2.5 outline-none"
                />
                <span className="flex items-center bg-slate-100 px-3 text-xs font-semibold text-slate-500">
                  {unit === 'CM' ? 'cm' : 'in'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeField(field.id)}
                disabled={fields.length === 1}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Remove ${field.label || `measurement ${index + 1}`}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
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
          {submitting ? 'Saving...' : 'Save measurement'}
        </button>
      </div>
    </form>
  )
}
