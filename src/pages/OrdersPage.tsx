import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Modal from '../components/common/Modal'
import PaginationControls from '../components/common/paginationControl'
import OrderForm from '../components/orders/OrderForm'
import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'
import { formatName } from '../utils/formatName'
import type { Client } from './ClientsPage'

export type Order = {
  id: string
  status: string
  dueDate?: string | null
  totalAmount?: number | null
  notes?: string | null
  clientId: string
  client?: Pick<Client, 'id' | 'name' | 'image'>
}

type Props = { onLogout: () => void }

const statuses = [
  'ALL',
  'PENDING',
  'CUTTING',
  'SEWING',
  'FITTING',
  'COMPLETED',
  'DELIVERED',
]

const statusStyles: Record<string, string> = {
  PENDING: 'border-[#ead8ad] bg-[#fbf3df] text-[#8a681f]',
  CUTTING: 'border-[#e4c7b8] bg-[#f8ebe4] text-[#965f45]',
  SEWING: 'border-[#c8d8cf] bg-[#edf3ef] text-[#4d705f]',
  FITTING: 'border-[#d9ced5] bg-[#f3edf1] text-[#775c6e]',
  COMPLETED: 'border-[#bcd8c8] bg-[#eaf5ee] text-[#397153]',
  DELIVERED: 'border-[#d8dcd9] bg-[#f0f2f0] text-[#5f6b65]',
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatAmount(value?: number | null) {
  if (value == null) return 'Not set'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function isOverdue(order: Order) {
  if (!order.dueDate || ['COMPLETED', 'DELIVERED'].includes(order.status)) return false
  return new Date(order.dueDate).getTime() < Date.now()
}

function initials(name?: string) {
  return formatName(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('') || 'TP'
}

export default function OrdersPage({ onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [status, setStatus] = useState('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const query = new URLSearchParams({ page: String(page), limit: '10' })
      if (status !== 'ALL') query.set('status', status)
      if (search) query.set('search', search)

      const [orderResponse, clientResponse] = await Promise.all([
        apiRequest<PaginatedResponse<Order>>(`/orders?${query.toString()}`),
        apiRequest<PaginatedResponse<Client>>('/clients?page=1&limit=100'),
      ])

      setOrders(orderResponse.data)
      setPagination(orderResponse.pagination)
      setClients(clientResponse.data)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load orders.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [onLogout, page, search, status])

  useEffect(() => {
    void load()
  }, [load])

  const activeOrders = orders.filter(
    (order) => !['COMPLETED', 'DELIVERED'].includes(order.status),
  ).length
  const overdueOrders = orders.filter(isOverdue).length
  const visibleValue = orders.reduce(
    (sum, order) => sum + (order.totalAmount ?? 0),
    0,
  )

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#8b7565]">Production</p>
            <h1 className="mt-1 font-display text-4xl text-[#263d47]">Manage orders</h1>
            <p className="mt-1 text-sm text-[#75817c]">Here&apos;s what&apos;s happening with your workshop orders.</p>
          </div>
          <button type="button" disabled={!clients.length} onClick={() => setShowCreate(true)} className="rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(38,61,71,0.18)] transition hover:bg-[#36515b] disabled:cursor-not-allowed disabled:opacity-45">
            + Add order
          </button>
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-[#e1e5e1] bg-white/90 p-5 shadow-[0_8px_24px_rgba(45,58,55,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#7c8781]">Total orders</p><p className="mt-2 font-display text-3xl text-[#263d47]">{pagination?.total ?? orders.length}</p></div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf2ef] text-[#557466]">▤</span>
            </div>
            <p className="mt-3 text-xs text-[#89928d]">Across all order records</p>
          </article>
          <article className="rounded-2xl border border-[#e1e5e1] bg-white/90 p-5 shadow-[0_8px_24px_rgba(45,58,55,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#7c8781]">Active on this page</p><p className="mt-2 font-display text-3xl text-[#263d47]">{activeOrders}</p></div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2ebdc] text-[#866d40]">◫</span>
            </div>
            <div className="mt-4 flex h-8 items-end gap-1" aria-hidden="true">{[35, 60, 45, 78, 52, 86, 63].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#778f83]" style={{ height: `${height}%`, opacity: 0.45 + index * 0.07 }} />)}</div>
          </article>
          <article className="rounded-2xl border border-[#e1e5e1] bg-white/90 p-5 shadow-[0_8px_24px_rgba(45,58,55,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#7c8781]">Visible order value</p><p className="mt-2 font-display text-2xl text-[#263d47]">{formatAmount(visibleValue)}</p></div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf2ef] text-[#557466]">₦</span>
            </div>
            <p className="mt-3 text-xs text-[#89928d]">Total for the current results</p>
          </article>
          <article className="rounded-2xl border border-[#ead9d5] bg-white/90 p-5 shadow-[0_8px_24px_rgba(45,58,55,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-[#8b6d68]">Overdue on this page</p><p className="mt-2 font-display text-3xl text-[#7e4740]">{overdueOrders}</p></div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f8ebe8] text-[#a65c52]">!</span>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#a65c52]">Needs attention</p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe4e0] bg-white/90 shadow-[0_12px_35px_rgba(45,58,55,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#e7ebe8] p-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#d9dfdb] bg-[#fafbf9] px-4 py-3 transition focus-within:border-[#8fa397] focus-within:ring-4 focus-within:ring-[#778f83]/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#77857e] stroke-2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" strokeLinecap="round" /></svg>
          <span className="sr-only">Search orders</span>
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search client name or notes" className="w-full bg-transparent text-sm text-[#263d47] placeholder:text-[#929b96] focus:outline-none" />
        </label>

        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => {
            const active = status === item
            return (
              <button key={item} type="button" onClick={() => { setStatus(item); setPage(1) }} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${active ? 'border-[#263d47] bg-[#263d47] text-white shadow-sm' : 'border-[#dce1dd] bg-white/80 text-[#65736d] hover:border-[#bfcac3] hover:bg-[#f0f3f0]'}`}>
                {item.charAt(0) + item.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>
          </div>

        {loading ? (
          <div className="rounded-2xl bg-white/80 p-8 text-center font-semibold text-[#69766f] shadow-sm">Loading orders…</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 text-left text-sm">
                <thead className="bg-[#f5f6f3] text-[#6f7b75]">
                  <tr>
                    <th className="p-4 text-xs font-extrabold uppercase tracking-wider">Customer</th>
                    <th className="p-4 text-xs font-extrabold uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-extrabold uppercase tracking-wider">Due date</th>
                    <th className="p-4 text-xs font-extrabold uppercase tracking-wider">Amount</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-[#edf0ed] transition hover:bg-[#f7f8f5]">
                      <td className="p-4"><div className="flex items-center gap-3">{order.client?.image ? <img src={order.client.image} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-[#edf2ef]" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf2ef] text-xs font-extrabold text-[#557466]">{initials(order.client?.name)}</span>}<span className="font-bold text-[#263d47]">{formatName(order.client?.name) || 'Unknown Client'}</span></div></td>
                      <td className="p-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[order.status] ?? statusStyles.DELIVERED}`}>{order.status.charAt(0) + order.status.slice(1).toLowerCase()}</span></td>
                      <td className="p-4 text-[#66736d]">{formatDate(order.dueDate)}</td>
                      <td className="p-4 font-semibold text-[#4e5e57]">{formatAmount(order.totalAmount)}</td>
                      <td className="p-4 text-right"><Link to={`/orders/${order.id}`} className="rounded-lg border border-[#c8d4cd] px-3 py-2 text-xs font-bold text-[#557466] transition hover:bg-[#edf2ef]">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!orders.length && <p className="p-8 text-center text-[#75817c]">No matching orders.</p>}
          </div>
        )}

        </section>

        <PaginationControls pagination={pagination} itemName="orders" onPageChange={setPage} />
      </div>

      {showCreate && (
        <Modal title="Add order" onClose={() => setShowCreate(false)}>
          <OrderForm clients={clients} onCancel={() => setShowCreate(false)} onCreated={async () => { setShowCreate(false); setPage(1); await load() }} />
        </Modal>
      )}
    </main>
  )
}
