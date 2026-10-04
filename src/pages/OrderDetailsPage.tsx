import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { apiRequest } from '../service/api'
import { formatName } from '../utils/formatName'
import type { Order } from './OrdersPage'

type Props = { onLogout: () => void }
type ApiEnvelope<T> = { status?: string; data: T }

function unwrap<T>(value: T | ApiEnvelope<T>): T {
  return typeof value === 'object' && value !== null && 'data' in value
    ? (value as ApiEnvelope<T>).data
    : (value as T)
}

const fieldClass = 'mt-1.5 w-full rounded-xl border border-[#d8dfda] bg-white px-3.5 py-3 text-[#263d47] outline-none transition focus:border-[#82998d] focus:ring-4 focus:ring-[#778f83]/10'

export default function OrderDetailsPage({ onLogout }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [form, setForm] = useState({ status: 'PENDING', dueDate: '', totalAmount: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError('')
      const response = await apiRequest<Order | ApiEnvelope<Order>>(`/orders/${id}`)
      const value = unwrap(response)
      setOrder(value)
      setForm({
        status: value.status,
        dueDate: value.dueDate?.slice(0, 10) || '',
        totalAmount: value.totalAmount?.toString() || '',
        notes: value.notes || '',
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load order.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [id, onLogout])

  useEffect(() => { void load() }, [load])

  async function save() {
    if (!id) return
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await apiRequest(`/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: form.status,
          dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00`).toISOString() : null,
          totalAmount: form.totalAmount ? Number(form.totalAmount) : null,
          notes: form.notes.trim() || null,
        }),
      })
      await load()
      setSuccess('Order updated successfully.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update order.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!id || !window.confirm('Delete this order?')) return
    try {
      setDeleting(true)
      setError('')
      await apiRequest(`/orders/${id}`, { method: 'DELETE' })
      navigate('/orders', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete order.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="p-8 text-center font-semibold text-[#69766f]">Loading order…</p>
  if (!order) return <p className="p-8 text-center text-red-600">{error || 'Order not found.'}</p>

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.07)] backdrop-blur-sm sm:p-7">
          <Link to="/orders" className="text-sm font-bold text-[#607d6f] hover:text-[#314b43]">← Orders</Link>
          <h1 className="mt-3 font-display text-4xl text-[#263d47]">Order details</h1>
          <p className="mt-1 text-sm text-[#75817c]">{formatName(order.client?.name) || 'Unknown Client'}</p>
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>}
        {success && <p className="rounded-2xl border border-[#bcd8c8] bg-[#eaf5ee] px-4 py-3 text-[#397153]">{success}</p>}

        <section className="space-y-5 rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.08)] sm:p-7">
          <label className="block text-sm font-bold text-[#4e5e57]">
            Status
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={fieldClass}>
              <option value="PENDING">Pending</option>
              <option value="CUTTING">Cutting</option>
              <option value="SEWING">Sewing</option>
              <option value="FITTING">Fitting</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-[#4e5e57]">Due date<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className={fieldClass} /></label>
            <label className="block text-sm font-bold text-[#4e5e57]">Amount (₦)<input type="number" min="0" value={form.totalAmount} onChange={(event) => setForm({ ...form, totalAmount: event.target.value })} className={fieldClass} /></label>
          </div>

          <label className="block text-sm font-bold text-[#4e5e57]">Notes<textarea rows={5} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`${fieldClass} resize-y`} /></label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0ed] pt-5">
            <button type="button" onClick={() => void remove()} disabled={deleting} className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">{deleting ? 'Deleting…' : 'Delete order'}</button>
            <button type="button" disabled={saving} onClick={() => void save()} className="rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#36515b] disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </section>
      </div>
    </main>
  )
}
