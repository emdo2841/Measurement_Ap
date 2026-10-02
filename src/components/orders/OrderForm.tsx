import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest } from '../../service/api'

type Client = {
  id: string
  name: string
  phone: string
}

type OrderFormProps = {
  clients: Client[]
  onCreated: () => Promise<void> | void
  onCancel: () => void
}

export default function OrderForm({
  clients,
  onCreated,
  onCancel,
}: OrderFormProps) {
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [status, setStatus] = useState('PENDING')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      await apiRequest('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          status,
          notes: notes.trim() || undefined,
          dueDate: dueDate
            ? new Date(`${dueDate}T12:00:00`).toISOString()
            : undefined,
          totalAmount: totalAmount ? Number(totalAmount) : undefined,
        }),
      })

      await onCreated()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to create order.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Client</label>
        <select
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          required
        >
          <option value="">Select a client</option>

          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} — {client.phone}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Due date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Total amount
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={totalAmount}
          onChange={(event) => setTotalAmount(event.target.value)}
          placeholder="Example: 45000"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="PENDING">Pending</option>
          <option value="CUTTING">Cutting</option>
          <option value="SEWING">Sewing</option>
          <option value="FITTING">Fitting</option>
          <option value="COMPLETED">Completed</option>
          <option value="DELIVERED">Delivered</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Notes</label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          placeholder="Style details, fabric information or special instructions"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-4 py-3"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create order'}
        </button>
      </div>
    </form>
  )
}