import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Modal from '../components/common/Modal'
import MeasurementForm from '../components/measurements/MeasurementForm'
import { apiRequest } from '../service/api'
import type { Client } from './ClientsPage'
import type { Measurement } from './MeasurementsPage'

type ApiEnvelope<T> = { status?: string; data: T }
type ClientDetails = Client & { measurements?: Measurement[] }
type Props = { onLogout: () => void }

function unwrap<T>(value: T | ApiEnvelope<T>): T {
  return typeof value === 'object' && value !== null && 'data' in value
    ? (value as ApiEnvelope<T>).data
    : value as T
}

export default function ClientMeasurementsPage({ onLogout }: Props) {
  const { clientId } = useParams()
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!clientId) return
    try {
      setLoading(true)
      setError('')
      const response = await apiRequest<ClientDetails | ApiEnvelope<ClientDetails>>(
        `/clients/${clientId}`,
      )
      setClient(unwrap(response))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load measurements.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [clientId, onLogout])

  useEffect(() => { void load() }, [load])

  if (loading) return <p className="p-8">Loading measurements...</p>
  if (!client) return <p className="p-8 text-red-600">{error || 'Client not found.'}</p>

  return (
    <main className="min-h-full px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/measurements" className="text-sm font-semibold text-blue-600">← All clients</Link>
            <h1 className="mt-2 text-3xl font-black">{client.name}&apos;s measurements</h1>
            <p className="mt-1 text-sm text-slate-500">
              Each card is a separate garment profile with its own history and sharing link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
          >
            Add measurement
          </button>
        </header>

        {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(client.measurements ?? []).map((measurement) => (
            <Link
              key={measurement.id}
              to={`/measurements/${measurement.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold">{measurement.title}</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {measurement.unit}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                {Object.keys(measurement.data ?? {}).length} measurement fields
              </p>
            </Link>
          ))}
          {!client.measurements?.length && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
              No measurements have been added for this client yet.
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <Modal title={`Add measurement for ${client.name}`} onClose={() => setShowCreate(false)}>
          <MeasurementForm
            clients={[client]}
            defaultClientId={client.id}
            onCancel={() => setShowCreate(false)}
            onCreated={async () => {
              setShowCreate(false)
              await load()
            }}
          />
        </Modal>
      )}
    </main>
  )
}