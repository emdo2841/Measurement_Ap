import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import PaginationControls from '../components/common/paginationControl'

import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'
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

type ClientWithMeasurements = Client & {
  measurements?: Measurement[]
}

type Props = { onLogout: () => void }

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
      const response = await apiRequest<PaginatedResponse<ClientWithMeasurements>>(
        `/clients?${query}`,
      )
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
  return (
    <main className="min-h-full px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Sizing</p>
          <h1 className="mt-1 text-3xl font-black">Client measurements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a client to view their blouse, trouser, skirt, suit and other measurement profiles.
          </p>
         </header>

         {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}


        <input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search client name, phone, email or address"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        />

        {loading ? (
          <p>Loading clients...</p>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Link
                key={client.id}
                to={`/measurements/client/${client.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {client.image ? (
                    <img src={client.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate font-bold">{client.name}</h2>
                    <p className="truncate text-sm text-slate-500">{client.phone}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Measurement profiles</span>
                  <strong className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    {client.measurements?.length ?? 0}
                  </strong>
                 </div>

              </Link>
            ))}
            {!clients.length && <p className="text-slate-500">No clients found.</p>}
          </section>
        )}

        <PaginationControls pagination={pagination} itemName="clients" onPageChange={setPage} />
      </div>
    </main>
  )
 }