import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import ClientForm from '../components/clients/ClientForm'
import Modal from '../components/common/Modal'
import MeasurementForm from '../components/measurements/MeasurementForm'
import OrderForm from '../components/orders/OrderForm'
import { apiRequest } from '../service/api'
import { formatName } from '../utils/formatName'
import type { Client } from './ClientsPage'

type Order = {
  id: string
  status: string
  dueDate?: string | null
  totalAmount?: number | null
}

type Measurement = {
  id: string
  title: string
  unit: string
  data: Record<string, number>
}

type ClientDetails = Client & {
  orders?: Order[]
  measurements?: Measurement[]
}

type ApiEnvelope<T> = { status?: string; data: T }
type Props = { onLogout: () => void }

function unwrap<T>(value: T | ApiEnvelope<T>): T {
  return typeof value === 'object' && value !== null && 'data' in value
    ? (value as ApiEnvelope<T>).data
    : (value as T)
}

function formatDate(value?: string | null) {
  if (!value) return 'No due date'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatAmount(value?: number | null) {
  if (value == null) return 'Amount not set'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ClientDetailsPage({ onLogout }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [modal, setModal] = useState<'edit' | 'order' | 'measurement' | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const loadClient = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError('')
      const response = await apiRequest<ClientDetails | ApiEnvelope<ClientDetails>>(
        `/clients/${id}`,
      )
      setClient(unwrap(response))
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Unable to load client.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [id, onLogout])

  useEffect(() => {
    void loadClient()
  }, [loadClient])

  async function deleteClient() {
    if (!id || !window.confirm('Delete this client and all associated records?')) return

    try {
      setDeleting(true)
      setError('')
      await apiRequest(`/clients/${id}`, { method: 'DELETE' })
      navigate('/clients', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete client.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <p className="p-8 text-center font-semibold text-[#69766f]">Loading client…</p>
  }

  if (!client) {
    return <p className="p-8 text-center text-red-600">{error || 'Client not found.'}</p>
  }

  const clientName = formatName(client.name)

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/80 bg-white/72 p-5 shadow-[0_12px_35px_rgba(45,58,55,0.07)] backdrop-blur-sm sm:p-7">
          <Link to="/clients" className="text-sm font-bold text-[#607d6f] hover:text-[#314b43]">
            ← Clients
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              {client.image ? (
                <img src={client.image} alt={clientName} className="h-16 w-16 rounded-full object-cover ring-4 ring-white shadow-sm" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#dfe7e2] text-xl font-extrabold text-[#314b43] ring-4 ring-white">
                  {clientName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate font-display text-4xl text-[#263d47]">{clientName}</h1>
                <p className="mt-1 text-sm text-[#75817c]">
                  {client.phone} <span className="px-1 text-[#b2b9b5]">·</span> {client.email || 'No email'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setModal('measurement')} className="rounded-xl border border-[#c8d4cd] bg-[#edf2ef] px-4 py-2.5 text-sm font-bold text-[#49675a] transition hover:bg-[#e1e9e4]">
                Add measurement
              </button>
              <button type="button" onClick={() => setModal('order')} className="rounded-xl bg-[#263d47] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#36515b]">
                Add order
              </button>
              <button type="button" onClick={() => setModal('edit')} className="rounded-xl border border-[#d7dcd8] bg-white px-4 py-2.5 text-sm font-bold text-[#596861] transition hover:bg-[#f1f3f0]">
                Edit
              </button>
              <button type="button" onClick={() => void deleteClient()} disabled={deleting} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/88 p-6 shadow-[0_10px_28px_rgba(45,58,55,0.07)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#263d47]">Measurements</h2>
                <p className="text-sm text-[#75817c]">One profile for each garment type.</p>
              </div>
              <Link to={`/measurements/client/${client.id}`} className="rounded-xl border border-[#c8d4cd] px-4 py-2 text-sm font-bold text-[#557466] transition hover:bg-[#edf2ef]">
                View all
              </Link>
            </div>

            {client.measurements?.length ? (
              <div className="mt-4 space-y-3">
                {client.measurements.slice(0, 4).map((measurement) => (
                  <Link key={measurement.id} to={`/measurements/${measurement.id}`} className="block rounded-xl border border-[#e2e7e3] p-4 transition hover:border-[#c6d3cb] hover:bg-[#f6f8f5]">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-[#263d47]">{measurement.title}</strong>
                      <span className="rounded-full bg-[#f2ebdc] px-3 py-1 text-xs font-bold text-[#866d40]">
                        {measurement.unit}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#75817c]">
                      {Object.keys(measurement.data ?? {}).length} measurement fields
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-[#f6f7f4] p-5 text-sm text-[#75817c]">
                This client does not have any measurements yet.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/88 p-6 shadow-[0_10px_28px_rgba(45,58,55,0.07)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#263d47]">Orders</h2>
                <p className="text-sm text-[#75817c]">Recent work for this client.</p>
              </div>
              <Link to="/orders" className="rounded-xl border border-[#d8cec4] px-4 py-2 text-sm font-bold text-[#725f52] transition hover:bg-[#f2ede8]">
                View orders
              </Link>
            </div>

            {client.orders?.length ? (
              <div className="mt-4 space-y-3">
                {client.orders.slice(0, 4).map((order) => (
                  <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-[#e5e2de] p-4 transition hover:border-[#d8cec4] hover:bg-[#faf7f3]">
                    <div>
                      <p className="font-bold capitalize text-[#263d47]">{order.status.toLowerCase().replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-xs text-[#7b8681]">Due {formatDate(order.dueDate)}</p>
                    </div>
                    <span className="text-sm font-bold text-[#725f52]">{formatAmount(order.totalAmount)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-[#f6f7f4] p-5 text-sm text-[#75817c]">
                This client does not have any orders yet.
              </p>
            )}
          </div>
        </section>
      </div>

      {modal === 'edit' && (
        <Modal title="Edit client" onClose={() => setModal(null)}>
          <ClientForm client={client} onCancel={() => setModal(null)} onSaved={async () => { setModal(null); await loadClient() }} />
        </Modal>
      )}
      {modal === 'order' && (
        <Modal title="Add order" onClose={() => setModal(null)}>
          <OrderForm clients={[client]} onCancel={() => setModal(null)} onCreated={async () => { setModal(null); await loadClient() }} />
        </Modal>
      )}
      {modal === 'measurement' && (
        <Modal title="Add measurement" onClose={() => setModal(null)}>
          <MeasurementForm clients={[client]} defaultClientId={client.id} onCancel={() => setModal(null)} onCreated={async () => { setModal(null); await loadClient() }} />
        </Modal>
      )}
    </main>
  )
}

