import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import Modal from '../components/common/Modal'
import MeasurementForm from '../components/measurements/MeasurementForm'
import { apiRequest } from '../service/api'
import { formatName } from '../utils/formatName'
import type { Client } from './ClientsPage'
import type { Measurement } from './MeasurementsPage'

type ApiEnvelope<T> = { status?: string; data: T }
type ClientDetails = Client & { measurements?: Measurement[] }
type Props = { onLogout: () => void }

function unwrap<T>(value: T | ApiEnvelope<T>): T {
  return typeof value === 'object' && value !== null && 'data' in value
    ? (value as ApiEnvelope<T>).data
    : (value as T)
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

      const response = await apiRequest<
        ClientDetails | ApiEnvelope<ClientDetails>
      >(`/clients/${clientId}`)

      setClient(unwrap(response))
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'Unable to load measurements.'

      setError(message)

      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [clientId, onLogout])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="p-8 text-center font-semibold text-[#69766f]">Loading measurements…</p>
  }

  if (!client) {
    return <p className="p-8 text-center text-red-600">{error || 'Client not found.'}</p>
  }

  const clientName = formatName(client.name)

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-5 rounded-3xl border border-white/80 bg-white/70 px-5 py-5 shadow-[0_12px_35px_rgba(45,58,55,0.07)] backdrop-blur-sm sm:px-7">
          <div>
            <Link to="/measurements" className="text-sm font-bold text-[#607d6f] hover:text-[#314b43]">
              ← All clients
            </Link>
            <h1 className="mt-2 font-display text-4xl text-[#263d47]">
              {clientName}&apos;s measurements
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#75817c]">
              Each card is a separate garment profile with its own history and sharing link.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(38,61,71,0.18)] transition hover:bg-[#36515b]"
          >
            + Add measurement
          </button>
        </header>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(client.measurements ?? []).map((measurement) => (
            <Link
              key={measurement.id}
              to={`/measurements/${measurement.id}`}
              className="group rounded-2xl border border-white/80 bg-white/88 p-5 shadow-[0_10px_28px_rgba(45,58,55,0.07)] transition hover:-translate-y-0.5 hover:border-[#cdd8d1] hover:shadow-[0_16px_36px_rgba(45,58,55,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-[#263d47]">{measurement.title}</h2>
                <span className="rounded-full bg-[#f2ebdc] px-3 py-1 text-xs font-bold text-[#866d40]">
                  {measurement.unit}
                </span>
              </div>
              <p className="mt-5 text-sm text-[#75817c]">
                {Object.keys(measurement.data ?? {}).length} measurement fields
              </p>
              <p className="mt-3 border-t border-[#edf0ed] pt-3 text-sm font-bold text-[#607d6f] transition group-hover:translate-x-0.5">
                Open measurement →
              </p>
            </Link>
          ))}

          {!client.measurements?.length && (
            <div className="rounded-2xl border border-dashed border-[#cdd5d0] bg-white/65 p-7 text-[#75817c] sm:col-span-2 lg:col-span-3">
              No measurements have been added for this client yet.
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <Modal title={`Add measurement for ${clientName}`} onClose={() => setShowCreate(false)}>
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
