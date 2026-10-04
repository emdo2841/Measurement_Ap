import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { formatName } from '../utils/formatName'

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
    else {
      setError('Invalid measurement link.')
      setLoading(false)
    }
  }, [token])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#f4f2ec]"><p className="rounded-2xl bg-white/85 px-6 py-4 font-semibold text-[#69766f] shadow-sm">Loading shared measurement…</p></main>

  return (
    <main className="min-h-screen bg-[#f4f2ec] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#263d47] text-lg font-black text-white">T</span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.2em] text-[#778f83]">TailorPro</p>
          <h1 className="mt-1 font-display text-4xl text-[#263d47]">Shared measurement</h1>
          <p className="mt-2 text-sm text-[#75817c]">Read-only measurement details shared securely with you.</p>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">{error}</p>
        ) : measurement && (
          <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(45,58,55,0.1)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8ece9] pb-5">
              <div><h2 className="font-display text-3xl text-[#263d47]">{measurement.title}</h2><p className="mt-1 text-[#75817c]">Client: {formatName(measurement.client.name)}</p></div>
              <span className="rounded-full bg-[#f2ebdc] px-3 py-1 text-sm font-bold text-[#866d40]">{measurement.unit}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(measurement.data).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-[#e7ebe8] bg-[#f7f8f5] px-4 py-3"><span className="text-[#66736d]">{label}</span><strong className="text-[#263d47]">{value} {measurement.unit === 'CM' ? 'cm' : 'in'}</strong></div>
              ))}
            </div>
            <p className="mt-6 border-t border-[#edf0ed] pt-4 text-xs text-[#8a938f]">Last updated {new Date(measurement.updatedAt).toLocaleString('en-NG')}</p>
          </section>
        )}
      </div>
    </main>
  )
}
