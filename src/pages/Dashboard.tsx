// CORRECT TAILORPRO DASHBOARD — contains dashboard data-loading and modal logic.
import { useCallback, useEffect, useMemo, useState } from 'react'
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
type IconName = 'clients' | 'measurement' | 'orders' | 'pending' | 'calendar'

type CollectionResult<T> = {
  items: T[]
  total: number
}

const cardClass =
  'rounded-2xl border border-white/80 bg-white/88 shadow-[0_12px_35px_rgba(45,58,55,0.09)] backdrop-blur-md'

function formatName(value?: string | null) {
  if (!value) return ''
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en-NG')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('en-NG'))
}

function extractCollection<T>(payload: unknown): CollectionResult<T> {
  if (Array.isArray(payload)) return { items: payload as T[], total: payload.length }

  if (typeof payload === 'object' && payload !== null) {
    const wrapped = payload as {
      data?: unknown
      pagination?: { total?: unknown }
    }

    const items = Array.isArray(wrapped.data) ? (wrapped.data as T[]) : []
    const paginationTotal = wrapped.pagination?.total

    return {
      items,
      total: typeof paginationTotal === 'number' ? paginationTotal : items.length,
    }
  }

  return { items: [], total: 0 }
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

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function initials(name?: string) {
  if (!name) return 'T'
  return formatName(name)
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  if (name === 'clients') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 20v-1.6a4.4 4.4 0 0 0-4.4-4.4H6.4A4.4 4.4 0 0 0 2 18.4V20" />
        <circle cx="9" cy="7" r="4" />
        <path d="M17 11a4 4 0 0 0 0-8M22 20v-1.6a4.4 4.4 0 0 0-3.2-4.2" />
      </svg>
    )
  }

  if (name === 'measurement') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m4 15 11-11 5 5L9 20H4v-5Z" />
        <path d="m12 7 2 2m-5 1 2 2m-5 1 2 2" />
      </svg>
    )
  }

  if (name === 'orders') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 4h10a2 2 0 0 1 2 2v15H5V6a2 2 0 0 1 2-2Z" />
        <path d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" />
      </svg>
    )
  }

  if (name === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  )
}

function Avatar({ person, size = 'md' }: { person?: { name: string; image?: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'

  if (person?.image) {
    return <img src={person.image} alt={formatName(person.name)} className={`${dimensions} rounded-full object-cover ring-2 ring-white`} />
  }

  return (
    <div className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#e5eae4] to-[#bccbbf] font-bold text-[#314b43] ring-2 ring-white`}>
      {initials(person?.name)}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase()
  const style =
    normalized === 'COMPLETED' || normalized === 'DELIVERED'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
      : normalized === 'IN_PROGRESS' || normalized === 'IN PROGRESS'
        ? 'bg-[#edf2ef] text-[#49675a] ring-[#6f8b7d]/20'
        : 'bg-amber-50 text-amber-700 ring-amber-600/15'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${style}`}>
      {status.toLowerCase().replaceAll('_', ' ')}
    </span>
  )
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [totals, setTotals] = useState({ clients: 0, orders: 0, measurements: 0 })
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
        apiRequest('/clients?page=1&limit=10'),
        apiRequest('/orders?page=1&limit=10'),
        apiRequest('/measurement?page=1&limit=10'),
      ])

      const clientResult = extractCollection<Client>(clientPayload)
      const orderResult = extractCollection<Order>(orderPayload)
      const measurementResult = extractCollection<Measurement>(measurementPayload)

      setUser(extractProfile(profilePayload))
      setClients(clientResult.items)
      setOrders(orderResult.items)
      setMeasurements(measurementResult.items)
      setTotals({
        clients: clientResult.total,
        orders: orderResult.total,
        measurements: measurementResult.total,
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load dashboard information.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  async function finishCreate(message: string) {
    setOpenModal(null)
    setSuccess(message)
    setError('')
    await loadDashboard()
  }

  const pendingOrders = useMemo(
    () => orders.filter((order) => !['COMPLETED', 'DELIVERED'].includes(order.status.toUpperCase())),
    [orders],
  )

  const upcomingOrders = useMemo(
    () =>
      [...pendingOrders]
        .filter((order) => order.dueDate)
        .sort((first, second) => new Date(first.dueDate!).getTime() - new Date(second.dueDate!).getTime())
        .slice(0, 5),
    [pendingOrders],
  )

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#f6f1e8] bg-cover bg-center"
        style={{ backgroundImage: "url('/tailorpro-dashboard-bg.png')" }}
      >
        <div className={`${cardClass} px-6 py-4 font-semibold text-[#263d47]`}>Loading dashboard…</div>
      </div>
    )
  }

  const firstName = formatName(user?.name).split(' ')[0] || 'Tailor'
  const stats: Array<{ label: string; value: number; icon: IconName; to: string; tone: string }> = [
    { label: 'Total clients', value: totals.clients, icon: 'clients', to: '/clients', tone: 'bg-[#edf2ef] text-[#4f6f61]' },
    { label: 'Measurements', value: totals.measurements, icon: 'measurement', to: '/measurements', tone: 'bg-[#f3eee3] text-[#8a6f3d]' },
    { label: 'Total orders', value: totals.orders, icon: 'orders', to: '/orders', tone: 'bg-[#eee9e3] text-[#725f52]' },
    { label: 'Pending orders', value: pendingOrders.length, icon: 'pending', to: '/orders', tone: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div
      className="min-h-full bg-[#f7f3eb] bg-cover bg-center bg-no-repeat text-[#263d47] lg:bg-fixed"
      style={{ backgroundImage: "linear-gradient(rgba(247,243,235,.82), rgba(247,243,235,.9)), url('/tailorpro-dashboard-bg.png')" }}
    >
      <main className="mx-auto max-w-400 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 rounded-3xl border border-white/70 bg-white/55 px-5 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#778f83]">Business overview</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#263d47] sm:text-4xl">
              {greeting()}, {firstName} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600">Here is what is happening in your workshop today.</p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-[#dbe3e8]">
            <Avatar person={user ?? undefined} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{formatName(user?.name) || 'Tailor'}</p>
              <p className="truncate text-xs text-slate-500">{user?.email ?? 'TailorPro account'}</p>
            </div>
          </div>
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        {success && <p className="rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm font-medium text-emerald-700">{success}</p>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.to} className={`${cardClass} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(45,58,55,0.14)]`}>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.tone}`}>
                <Icon name={stat.icon} className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-black tracking-tight text-[#263d47]">{stat.value}</p>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(300px,.75fr)]">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-[#e7e7e2] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf2ef] text-[#4f6f61]"><Icon name="orders" /></span>
                <h2 className="text-lg font-black">Pending orders</h2>
              </div>
              <Link to="/orders" className="text-sm font-bold text-[#557466] hover:text-[#314b43]">View all →</Link>
            </div>

            <div className="overflow-x-auto px-3 pb-3 sm:px-5">
              <table className="w-full min-w-180 text-left text-sm">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-3 py-4">Client</th>
                    <th className="px-3 py-4">Due date</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Amount</th>
                    <th className="px-3 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.length ? (
                    pendingOrders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="border-t border-[#edf0f1] transition hover:bg-[#f7fafb]/80">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar person={{ name: order.client?.name ?? 'Client', image: order.client?.image }} size="sm" />
                            <span className="font-bold text-[#263d47]">{formatName(order.client?.name) || 'Unknown Client'}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{formatDate(order.dueDate)}</td>
                        <td className="px-3 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-3 py-3 font-semibold text-slate-700">{formatAmount(order.totalAmount)}</td>
                        <td className="px-3 py-3 text-right">
                          <Link to={`/orders/${order.id}`} className="inline-flex rounded-lg bg-[#263d47] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#36515b]">View</Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-3 py-12 text-center text-slate-500">No pending orders. Your workshop is all caught up.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5f7] text-[#4e7890]"><Icon name="calendar" /></span>
                <h2 className="text-lg font-black">Upcoming deadlines</h2>
              </div>
              <Link to="/calendar" className="text-xs font-bold text-[#557466] hover:text-[#314b43]">Calendar →</Link>
            </div>

            <div className="mt-5 space-y-1">
              {upcomingOrders.length ? upcomingOrders.map((order, index) => (
                <Link key={order.id} to={`/orders/${order.id}`} className="flex gap-3 rounded-xl px-2 py-3 transition hover:bg-[#f3f7f9]">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${index % 3 === 0 ? 'bg-[#6f8b7d]' : index % 3 === 1 ? 'bg-[#b6975a]' : 'bg-[#9b7566]'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#263d47]">{formatName(order.client?.name) || 'Client'}'s order</span>
                    <span className="mt-1 block text-xs text-slate-500">Due {formatDate(order.dueDate)}</span>
                  </span>
                </Link>
              )) : <p className="rounded-xl bg-[#f7f8f6] px-4 py-6 text-center text-sm text-slate-500">No upcoming deadlines.</p>}
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">Recent clients</h2>
              <Link to="/clients" className="text-sm font-bold text-[#557466] hover:text-[#314b43]">View all →</Link>
            </div>

            <div className="mt-4 space-y-2">
              {clients.length ? clients.slice(0, 5).map((client) => (
                <Link key={client.id} to={`/clients/${client.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-[#dbe4e9] hover:bg-[#f7fafb]">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar person={client} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{formatName(client.name)}</p>
                      <p className="truncate text-xs text-slate-500">{client.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(client.createdAt)}</span>
                </Link>
              )) : <p className="rounded-xl bg-[#f7f8f6] px-4 py-6 text-center text-sm text-slate-500">You have not added any clients.</p>}
            </div>
          </div>

          <div className="space-y-5">
            <div className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="text-lg font-black">Quick actions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => setOpenModal('client')} className="flex items-center justify-center gap-2 rounded-xl border border-[#cbd8d0] bg-[#edf2ef] px-4 py-3 text-sm font-bold text-[#49675a] transition hover:bg-[#e1e9e4]">
                  <Icon name="clients" /> Add client
                </button>
                <button type="button" disabled={!clients.length} onClick={() => setOpenModal('order')} className="flex items-center justify-center gap-2 rounded-xl border border-[#d8cec4] bg-[#f2ede8] px-4 py-3 text-sm font-bold text-[#725f52] transition hover:bg-[#eae1da] disabled:cursor-not-allowed disabled:opacity-40">
                  <Icon name="orders" /> Add order
                </button>
                <button type="button" disabled={!clients.length} onClick={() => setOpenModal('measurement')} className="flex items-center justify-center gap-2 rounded-xl border border-[#dfd2b8] bg-[#f3eee3] px-4 py-3 text-sm font-bold text-[#8a6f3d] transition hover:bg-[#ebe2d0] disabled:cursor-not-allowed disabled:opacity-40">
                  <Icon name="measurement" /> Add measurement
                </button>
              </div>
            </div>

            <div className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black">Recent measurements</h2>
                <Link to="/measurements" className="text-sm font-bold text-[#557466] hover:text-[#314b43]">View all →</Link>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {measurements.length ? measurements.slice(0, 4).map((measurement) => (
                  <Link key={measurement.id} to={`/measurements/${measurement.id}`} className="rounded-xl border border-[#e2e8eb] bg-[#fafcfc]/80 p-3 transition hover:border-[#b9ced8] hover:bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold">{measurement.title}</p>
                      <span className="rounded-full bg-[#f1eadc] px-2 py-1 text-[10px] font-bold text-[#866d40]">{measurement.unit}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{formatName(measurement.client?.name) || 'Client'}</p>
                  </Link>
                )) : <p className="text-sm text-slate-500">No measurements have been recorded.</p>}
              </div>
            </div>
          </div>
        </section>
      </main>

      {openModal === 'client' && (
        <Modal title="Add client" onClose={() => setOpenModal(null)}>
          <ClientForm onCancel={() => setOpenModal(null)} onSaved={() => finishCreate('Client created successfully.')} />
        </Modal>
      )}

      {openModal === 'order' && (
        <Modal title="Add order" onClose={() => setOpenModal(null)}>
          <OrderForm clients={clients} onCancel={() => setOpenModal(null)} onCreated={() => finishCreate('Order created successfully.')} />
        </Modal>
      )}

      {openModal === 'measurement' && (
        <Modal title="Add measurement" onClose={() => setOpenModal(null)}>
          <MeasurementForm clients={clients} onCancel={() => setOpenModal(null)} onCreated={() => finishCreate('Measurement created successfully.')} />
        </Modal>
      )}
    </div>
  )
}
