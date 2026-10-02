import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../components/common/Modal'
import PaginationControls from '../components/common/paginationControl'
import OrderForm from '../components/orders/OrderForm'
import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'
import type { Client } from './ClientsPage'

export type Order = { id: string; status: string; dueDate?: string | null; totalAmount?: number | null; notes?: string | null; clientId: string; client?: Pick<Client, 'id' | 'name' | 'image'> }
type Props = { onLogout: () => void }
const statuses = ['ALL', 'PENDING', 'CUTTING', 'SEWING', 'FITTING', 'COMPLETED', 'DELIVERED']

export default function OrdersPage({ onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([]); const [clients, setClients] = useState<Client[]>([])
  const [status, setStatus] = useState('ALL'); const [searchInput, setSearchInput] = useState(''); const [search, setSearch] = useState('')
  const [page, setPage] = useState(1); const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [showCreate, setShowCreate] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('')

  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput.trim()) }, 350); return () => window.clearTimeout(timer) }, [searchInput])
  const load = useCallback(async () => { try { setLoading(true); setError(''); const query = new URLSearchParams({ page: String(page), limit: '10', status }); if (search) query.set('search', search); const [orderResponse, clientResponse] = await Promise.all([apiRequest<PaginatedResponse<Order>>(`/orders?${query}`), apiRequest<PaginatedResponse<Client>>('/clients?page=1&limit=100')]); setOrders(orderResponse.data); setPagination(orderResponse.pagination); setClients(clientResponse.data) } catch (cause) { const message = cause instanceof Error ? cause.message : 'Unable to load orders.'; setError(message); if (message.toLowerCase().includes('session')) onLogout() } finally { setLoading(false) } }, [onLogout, page, search, status])
  useEffect(() => { void load() }, [load])

  return <main className="min-h-full px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl space-y-6"><header className="flex flex-wrap justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Production</p><h1 className="mt-1 text-3xl font-black">Orders</h1></div><button disabled={!clients.length} onClick={() => setShowCreate(true)} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Add order</button></header>{error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search client name or notes" className="w-full rounded-xl border bg-white px-4 py-3" /><div className="flex flex-wrap gap-2">{statuses.map((item) => <button key={item} onClick={() => { setStatus(item); setPage(1) }} className={`rounded-full px-4 py-2 text-xs font-semibold ${status === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{item}</button>)}</div>{loading ? <p>Loading orders...</p> : <section className="overflow-hidden rounded-2xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-175 text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Client</th><th className="p-4">Status</th><th className="p-4">Due date</th><th className="p-4">Amount</th><th className="p-4" /></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-t"><td className="p-4 font-semibold">{order.client?.name || 'Unknown client'}</td><td className="p-4">{order.status}</td><td className="p-4">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'Not set'}</td><td className="p-4">{order.totalAmount == null ? 'Not set' : `₦${order.totalAmount.toLocaleString()}`}</td><td className="p-4"><Link to={`/orders/${order.id}`} className="font-semibold text-blue-600">View</Link></td></tr>)}</tbody></table></div>{!orders.length && <p className="p-8 text-center text-slate-500">No matching orders.</p>}</section>}<PaginationControls pagination={pagination} itemName="orders" onPageChange={setPage} /></div>{showCreate && <Modal title="Add order" onClose={() => setShowCreate(false)}><OrderForm clients={clients} onCancel={() => setShowCreate(false)} onCreated={async () => { setShowCreate(false); setPage(1); await load() }} /></Modal>}</main>
}
