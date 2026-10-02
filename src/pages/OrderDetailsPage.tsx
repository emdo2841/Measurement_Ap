import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../service/api'
import type { Order } from './OrdersPage'

type Props = { onLogout: () => void }

export default function OrderDetailsPage({ onLogout }: Props) {
  const { id } = useParams(); const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [form, setForm] = useState({ status: 'PENDING', dueDate: '', totalAmount: '', notes: '' })
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const value = await apiRequest<Order>(`/orders/${id}`); setOrder(value)
      setForm({ status: value.status, dueDate: value.dueDate?.slice(0, 10) || '', totalAmount: value.totalAmount?.toString() || '', notes: value.notes || '' }); setError('')
    } catch (cause) { const message = cause instanceof Error ? cause.message : 'Unable to load order.'; setError(message); if (message.includes('session')) onLogout() }
  }, [id, onLogout])
  useEffect(() => { void load() }, [load])

  async function save() {
    if (!id) return
    try { setSaving(true); await apiRequest(`/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: form.status, dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00`).toISOString() : null, totalAmount: form.totalAmount ? Number(form.totalAmount) : null, notes: form.notes.trim() || null }) }); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update order.') } finally { setSaving(false) }
  }
  async function remove() { if (!id || !confirm('Delete this order?')) return; await apiRequest(`/orders/${id}`, { method: 'DELETE' }); navigate('/orders', { replace: true }) }
  if (!order) return <p className="p-8">{error || 'Loading order...'}</p>

  return <main className="min-h-screen bg-slate-100 px-4 py-8"><div className="mx-auto max-w-3xl space-y-6">
    <header><Link to="/orders" className="text-sm font-semibold text-blue-600">← Orders</Link><h1 className="mt-2 text-3xl font-black">Order details</h1><p className="text-slate-500">{order.client?.name || 'Unknown client'}</p></header>
    {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <label className="block text-sm font-medium">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-xl border p-3"><option>PENDING</option><option>CUTTING</option><option>SEWING</option><option>FITTING</option><option>COMPLETED</option><option>DELIVERED</option></select></label>
      <label className="block text-sm font-medium">Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm font-medium">Amount<input type="number" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
      <label className="block text-sm font-medium">Notes<textarea rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-xl border p-3" /></label>
      <div className="flex justify-between"><button onClick={() => void remove()} className="rounded-xl border border-red-300 px-4 py-3 text-red-600">Delete order</button><button disabled={saving} onClick={() => void save()} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></div>
    </section>
  </div></main>
}
