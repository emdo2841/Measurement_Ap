import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import PaginationControls from '../components/common/paginationControl'
import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'
import { formatName } from '../utils/formatName'
import type { Client } from './ClientsPage'

export type Measurement = {
  id: string
  title: string
  unit: 'CM' | 'INCHES'
  data: Record<string, number>
  clientId: string
  createdAt?: string
  updatedAt?: string
}

type ClientWithMeasurements = Client & { measurements?: Measurement[] }
type Props = { onLogout: () => void }

function initials(name: string) {
  return formatName(name).split(' ').slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()
}

function formatDate(value?: string) {
  if (!value) return 'Not updated'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(value))
}

function latestUpdate(client: ClientWithMeasurements) {
  const timestamps = (client.measurements ?? [])
    .map((measurement) => measurement.updatedAt ?? measurement.createdAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())

  if (!timestamps.length) return undefined
  return new Date(Math.max(...timestamps)).toISOString()
}

export default function MeasurementsPage({ onLogout }: Props) {
  const [clients, setClients] = useState<ClientWithMeasurements[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
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
      if (search) query.set('search', search)
      const response = await apiRequest<PaginatedResponse<ClientWithMeasurements>>(`/clients?${query.toString()}`)
      setClients(response.data)
      setPagination(response.pagination)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load clients.'
      setError(message)
      if (message.toLowerCase().includes('session')) onLogout()
    } finally {
      setLoading(false)
    }
  }, [onLogout, page, search])

  useEffect(() => { void load() }, [load])

  const visibleProfiles = clients.reduce((total, client) => total + (client.measurements?.length ?? 0), 0)
  const clientsWithProfiles = clients.filter((client) => (client.measurements?.length ?? 0) > 0).length
  const clientsWithoutProfiles = clients.length - clientsWithProfiles

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#8a754d]">Sizing</p>
            <h1 className="mt-1 font-display text-4xl text-[#263d47]">Manage measurements</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#75817c]">A central hub for every client&apos;s garment and body profiles.</p>
          </div>
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total clients" value={pagination?.total ?? clients.length} note="Available client records" icon="♙" tone="sage" />
          <SummaryCard label="Profiles on this page" value={visibleProfiles} note="Garment measurement profiles" icon="⌇" tone="gold" chart />
          <SummaryCard label="With profiles" value={clientsWithProfiles} note="Clients ready for order sizing" icon="✓" tone="sage" />
          <SummaryCard label="Needs measurement" value={clientsWithoutProfiles} note="No profile recorded yet" icon="!" tone="alert" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe4e0] bg-white/90 shadow-[0_12px_35px_rgba(45,58,55,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#e7ebe8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl text-[#263d47]">All client profiles</h2>
              <p className="mt-1 text-xs text-[#89928d]">Select a client to view, add or update garment measurements.</p>
            </div>
            <label className="flex w-full items-center gap-3 rounded-xl border border-[#d9dfdb] bg-[#fafbf9] px-4 py-3 transition focus-within:border-[#8fa397] focus-within:ring-4 focus-within:ring-[#778f83]/10 lg:max-w-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#77857e] stroke-2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" strokeLinecap="round" /></svg>
              <span className="sr-only">Search measurement clients</span>
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, phone, email or address" className="w-full bg-transparent text-sm text-[#263d47] placeholder:text-[#929b96] focus:outline-none" />
            </label>
          </div>

          {loading ? (
            <div className="p-10 text-center font-semibold text-[#69766f]">Loading measurement clients…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left text-sm">
                <thead className="bg-[#f5f6f3] text-[#6f7b75]">
                  <tr>
                    {['Customer', 'Contact', 'Profile types', 'Last updated', 'Profiles', 'Status'].map((heading) => <th key={heading} className="p-4 text-xs font-extrabold uppercase tracking-wider">{heading}</th>)}
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const measurements = client.measurements ?? []
                    const hasProfiles = measurements.length > 0
                    return (
                      <tr key={client.id} className="border-t border-[#edf0ed] transition hover:bg-[#f7f8f5]">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {client.image ? <img src={client.image} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#edf2ef]" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#eee7d8] to-[#d7c69f] text-xs font-extrabold text-[#765f34]">{initials(client.name)}</span>}
                            <span className="font-bold text-[#263d47]">{formatName(client.name)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-[#596861]">{client.phone}</p>
                          <p className="mt-0.5 max-w-55 truncate text-xs text-[#929b96]">{client.email || 'No email supplied'}</p>
                        </td>
                        <td className="p-4">
                          {hasProfiles ? (
                            <div className="flex max-w-65 flex-wrap gap-1.5">
                              {measurements.slice(0, 3).map((measurement) => <span key={measurement.id} className="rounded-full border border-[#d6e0da] bg-[#edf2ef] px-2.5 py-1 text-xs font-semibold text-[#557466]">{measurement.title}</span>)}
                              {measurements.length > 3 && <span className="rounded-full bg-[#f2ebdc] px-2.5 py-1 text-xs font-bold text-[#866d40]">+{measurements.length - 3}</span>}
                            </div>
                          ) : <span className="text-xs text-[#9a8d89]">No garment profiles</span>}
                        </td>
                        <td className="p-4 text-[#66736d]">{formatDate(latestUpdate(client))}</td>
                        <td className="p-4 font-display text-xl text-[#263d47]">{measurements.length}</td>
                        <td className="p-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${hasProfiles ? 'border-[#c8d8cf] bg-[#edf3ef] text-[#4d705f]' : 'border-[#ead8ad] bg-[#fbf3df] text-[#8a681f]'}`}>{hasProfiles ? 'Active' : 'Needs profile'}</span></td>
                        <td className="p-4 text-right"><Link to={`/measurements/client/${client.id}`} className="inline-flex rounded-lg border border-[#c8d4cd] px-3 py-2 text-xs font-bold text-[#557466] transition hover:bg-[#edf2ef]">{hasProfiles ? 'View profiles' : 'Add profile'}</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {!clients.length && <p className="p-10 text-center text-[#75817c]">No clients found.</p>}
            </div>
          )}
        </section>

        <PaginationControls pagination={pagination} itemName="clients" onPageChange={setPage} />
      </div>
    </main>
  )
}

type SummaryCardProps = {
  label: string
  value: number
  note: string
  icon: string
  tone: 'sage' | 'gold' | 'alert'
  chart?: boolean
}

function SummaryCard({ label, value, note, icon, tone, chart = false }: SummaryCardProps) {
  const toneStyle = tone === 'alert'
    ? 'bg-[#f8ebe8] text-[#a65c52]'
    : tone === 'gold'
      ? 'bg-[#f2ebdc] text-[#866d40]'
      : 'bg-[#edf2ef] text-[#557466]'
  const valueStyle = tone === 'alert' ? 'text-[#7e4740]' : 'text-[#263d47]'

  return (
    <article className="rounded-2xl border border-[#e1e5e1] bg-white/90 p-5 shadow-[0_8px_24px_rgba(45,58,55,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#7c8781]">{label}</p><p className={`mt-2 font-display text-3xl ${valueStyle}`}>{value}</p></div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg font-bold ${toneStyle}`}>{icon}</span>
      </div>
      {chart ? <div className="mt-4 flex h-8 items-end gap-1" aria-hidden="true">{[36, 58, 44, 78, 55, 88, 67].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#778f83]" style={{ height: `${height}%`, opacity: 0.44 + index * 0.07 }} />)}</div> : <p className={`mt-3 text-xs ${tone === 'alert' ? 'font-semibold text-[#a65c52]' : 'text-[#89928d]'}`}>{note}</p>}
    </article>
  )
}
