import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../components/common/Modal'
import PaginationControls from '../components/common/paginationControl'
import MeasurementForm from '../components/measurements/MeasurementForm'
import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'
import type { Client } from './ClientsPage'

export type Measurement = { id: string; title: string; unit: 'CM' | 'INCHES'; data: Record<string, number>; clientId: string; client?: Pick<Client, 'id' | 'name' | 'image'>; createdAt?: string }
type Props = { onLogout: () => void }

export default function MeasurementsPage({ onLogout }: Props) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]); const [clients, setClients] = useState<Client[]>([])
  const [searchInput, setSearchInput] = useState(''); const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [showCreate, setShowCreate] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput.trim()) }, 350); return () => window.clearTimeout(timer) }, [searchInput])
  const load = useCallback(async () => { try { setLoading(true); setError(''); const query = new URLSearchParams({ page: String(page), limit: '10' }); if (search) query.set('search', search); const [measurementResponse, clientResponse] = await Promise.all([apiRequest<PaginatedResponse<Measurement>>(`/measurement?${query}`), apiRequest<PaginatedResponse<Client>>('/clients?page=1&limit=100')]); setMeasurements(measurementResponse.data); setPagination(measurementResponse.pagination); setClients(clientResponse.data) } catch (cause) { const message = cause instanceof Error ? cause.message : 'Unable to load measurements.'; setError(message); if (message.toLowerCase().includes('session')) onLogout() } finally { setLoading(false) } }, [onLogout, page, search])
  useEffect(() => { void load() }, [load])

  return <main className="min-h-full px-4 py-8 sm:px-6">
    <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap justify-between gap-4">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Sizing</p>
                <h1 className="mt-1 text-3xl font-black">Measurements</h1>
            </div>
            <button disabled={!clients.length} onClick={() => setShowCreate(true)} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Add measurement</button>
        </header>
        {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search title or client" className="w-full rounded-xl border bg-white px-4 py-3" />
        {loading ? <p>Loading measurements...</p> : 
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {measurements.map((item) => <Link key={item.id} to={`/measurements/${item.id}`} className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
            <div className="flex justify-between">
                <h2 className="font-bold">{item.title}</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item.unit}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{item.client?.name || 'Unknown client'}</p>
        <p className="mt-4 text-xs text-slate-400">{Object.keys(item.data || {}).length} fields</p></Link>)}{!measurements.length && <p className="text-slate-500">No measurements found.</p>}</section>}<PaginationControls pagination={pagination} itemName="measurements" onPageChange={setPage} /></div>{showCreate && <Modal title="Add measurement" onClose={() => setShowCreate(false)}><MeasurementForm clients={clients} onCancel={() => setShowCreate(false)} onCreated={async () => { setShowCreate(false); setPage(1); await load() }} /></Modal>}</main>
}
