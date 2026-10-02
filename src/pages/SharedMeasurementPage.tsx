import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1'

type SharedMeasurement = {
  title: string
  unit: 'CM' | 'INCHES'
  data: Record<string, number>
  updatedAt: string
  client: { name: string }
}

export default function SharedMeasurementPage() {
  const { token } = useParams()
  const [measurement, setMeasurement] = useState<SharedMeasurement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/shared/measurements/${token}`)
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error('This measurement link has expired or was revoked.')
        setMeasurement(payload.data ?? payload)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to open this measurement.')
      } finally {
        setLoading(false)
      }
    }
    if (token) void load()
    else { setError('Invalid measurement link.'); setLoading(false) }
  }, [token])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-100"><p>Loading shared measurement...</p></main>

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">TailorPro</p><h1 className="mt-1 text-3xl font-black">Shared measurement</h1></div>
        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</p> : measurement && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5"><div><h2 className="text-2xl font-bold">{measurement.title}</h2><p className="mt-1 text-slate-500">Client: {measurement.client.name}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{measurement.unit}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(measurement.data).map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{label}</span><strong>{value} {measurement.unit === 'CM' ? 'cm' : 'in'}</strong></div>)}</div><p className="mt-6 text-xs text-slate-400">Last updated {new Date(measurement.updatedAt).toLocaleString('en-NG')}</p></section>}
      </div>
    </main>
  )
}
