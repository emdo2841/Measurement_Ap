import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClientForm from '../components/clients/ClientForm'
import Modal from '../components/common/Modal'
import MeasurementForm from '../components/measurements/MeasurementForm'
import OrderForm from '../components/orders/OrderForm'
import { apiRequest } from '../service/api'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
  image?: string | null
}

type Client = {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  gender?: string
  image?: string | null
  createdAt?: string
}

type Order = {
  id: string
  status: string
  dueDate?: string | null
  totalAmount?: number | null
  createdAt?: string
  client?: { id: string; name: string; image?: string | null }
}

type Measurement = {
  id: string
  title: string
  unit: 'CM' | 'INCHES'
  data: Record<string, number>
  clientId: string
  createdAt?: string
  client?: { id: string; name: string; image?: string | null }
}

type DashboardProps = { onLogout: () => void }
type OpenModal = 'client' | 'order' | 'measurement' | null

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (typeof payload === 'object' && payload !== null) {
    const wrapped = payload as { data?: unknown }
    if (Array.isArray(wrapped.data)) return wrapped.data as T[]
  }
  return []
}

function extractProfile(payload: unknown): UserProfile | null {
  if (typeof payload !== 'object' || payload === null) return null
  const wrapped = payload as { data?: unknown }
  const value = wrapped.data ?? payload
  return typeof value === 'object' && value !== null ? (value as UserProfile) : null
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(value))
}

function formatAmount(value?: number | null) {
  if (value == null) return 'Not set'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(value)
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [openModal, setOpenModal] = useState<OpenModal>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [profilePayload, clientPayload, orderPayload, measurementPayload] = await Promise.all([
        apiRequest('/users/profile'),
        apiRequest('/clients'),
        apiRequest('/orders'),
        apiRequest('/measurement'),
      ])
      setUser(extractProfile(profilePayload))
      setClients(extractList<Client>(clientPayload))
      setOrders(extractList<Order>(orderPayload))
      setMeasurements(extractList<Measurement>(measurementPayload))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load dashboard information.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  async function finishCreate(message: string) {
    setOpenModal(null)
    setSuccess(message)
    setError('')
    await loadDashboard()
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">Loading dashboard...</div></div>
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Overview</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Dashboard</h1>
        </header>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Welcome back</p>
            <div className="mt-4 flex items-center gap-4">
              {user?.image ? <img src={user.image} alt={user.name} className="h-16 w-16 rounded-full object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">{user?.name?.charAt(0).toUpperCase() ?? 'T'}</div>}
              <div><h2 className="text-4xl font-black tracking-tighter">{user?.name ?? 'Tailor'}</h2><p className="mt-1 text-slate-600">{user?.email ?? 'No email available'}</p></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Quick actions</p>
            <div className="mt-4 grid gap-3">
              <button type="button" onClick={() => setOpenModal('client')} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Add new client</button>
              <button type="button" disabled={!clients.length} onClick={() => setOpenModal('order')} className="rounded-xl border border-violet-600 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">Add order</button>
              <button type="button" disabled={!clients.length} onClick={() => setOpenModal('measurement')} className="rounded-xl border border-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50">Add measurement</button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Link to="/clients" className="rounded-2xl bg-blue-600 p-6 text-white shadow-sm"><p className="text-sm text-blue-100">Total clients</p><p className="mt-2 text-4xl font-black">{clients.length}</p></Link>
          <Link to="/orders" className="rounded-2xl bg-violet-600 p-6 text-white shadow-sm"><p className="text-sm text-violet-100">Total orders</p><p className="mt-2 text-4xl font-black">{orders.length}</p></Link>
          <Link to="/measurements" className="rounded-2xl bg-emerald-600 p-6 text-white shadow-sm"><p className="text-sm text-emerald-100">Measurements</p><p className="mt-2 text-4xl font-black">{measurements.length}</p></Link>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between"><h2 className="text-lg font-bold">Recent clients</h2><Link to="/clients" className="text-sm font-semibold text-blue-600">View all</Link></div>
            <div className="mt-4 space-y-3">{clients.length ? clients.slice(0, 5).map((client) => <Link key={client.id} to={`/clients/${client.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><div><p className="font-semibold">{client.name}</p><p className="text-sm text-slate-500">{client.phone}</p></div><p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p></Link>) : <p className="text-sm text-slate-500">You have not added any clients.</p>}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between"><h2 className="text-lg font-bold">Recent measurements</h2><Link to="/measurements" className="text-sm font-semibold text-blue-600">View all</Link></div>
            <div className="mt-4 space-y-3">{measurements.length ? measurements.slice(0, 5).map((measurement) => <Link key={measurement.id} to={`/measurements/${measurement.id}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50"><div><p className="font-semibold">{measurement.title}</p><p className="text-sm text-slate-500">{measurement.client?.name ?? 'Client'} · {measurement.unit}</p></div><p className="text-xs text-slate-400">{formatDate(measurement.createdAt)}</p></Link>) : <p className="text-sm text-slate-500">No measurements have been recorded.</p>}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between"><h2 className="text-lg font-bold">Recent orders</h2><Link to="/orders" className="text-sm font-semibold text-blue-600">View all</Link></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-175 text-left text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="px-3 py-3">Client</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Due date</th><th className="px-3 py-3">Amount</th></tr></thead><tbody>{orders.length ? orders.slice(0, 10).map((order) => <tr key={order.id} className="border-b border-slate-100"><td className="px-3 py-3 font-medium"><Link to={`/orders/${order.id}`} className="hover:text-blue-600">{order.client?.name ?? 'Unknown client'}</Link></td><td className="px-3 py-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{order.status}</span></td><td className="px-3 py-3">{formatDate(order.dueDate)}</td><td className="px-3 py-3">{formatAmount(order.totalAmount)}</td></tr>) : <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">No orders available.</td></tr>}</tbody></table></div>
        </section>
      </main>

      {openModal === 'client' && <Modal title="Add client" onClose={() => setOpenModal(null)}><ClientForm onCancel={() => setOpenModal(null)} onSaved={() => finishCreate('Client created successfully.')} /></Modal>}
      {openModal === 'order' && <Modal title="Add order" onClose={() => setOpenModal(null)}><OrderForm clients={clients} onCancel={() => setOpenModal(null)} onCreated={() => finishCreate('Order created successfully.')} /></Modal>}
      {openModal === 'measurement' && <Modal title="Add measurement" onClose={() => setOpenModal(null)}><MeasurementForm clients={clients} onCancel={() => setOpenModal(null)} onCreated={() => finishCreate('Measurement created successfully.')} /></Modal>}
    </div>
  )
}
