import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClientForm from '../components/clients/ClientForm'
import Modal from '../components/common/Modal'
import PaginationControls from '../components/common/paginationControl'
import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'

export type Client = { id: string; name: string; phone: string; email?: string | null; address?: string | null; gender?: string; image?: string | null; createdAt?: string }
type Props = { onLogout: () => void }

export default function ClientsPage({ onLogout }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput.trim()) }, 350); return () => window.clearTimeout(timer) }, [searchInput])

  const loadClients = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const query = new URLSearchParams({ page: String(page), limit: '10' })
      if (search) query.set('search', search)
      const response = await apiRequest<PaginatedResponse<Client>>(`/clients?${query}`)
      setClients(response.data); setPagination(response.pagination)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load clients.'
      setError(message); if (message.toLowerCase().includes('session')) onLogout()
    } finally { setLoading(false) }
  }, [onLogout, page, search])

  useEffect(() => { void loadClients() }, [loadClients])

  return <main className="min-h-full px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Customers</p><h1 className="mt-1 text-3xl font-black">Clients</h1><p className="text-sm text-slate-500">Manage customer profiles and work history.</p></div><button onClick={() => setShowCreate(true)} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Add client</button></header>
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, phone, email or address" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3" />
    {loading ? <p>Loading clients...</p> : <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{clients.map((client) => <Link key={client.id} to={`/clients/${client.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-3">{client.image ? <img src={client.image} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{client.name.charAt(0).toUpperCase()}</div>}<div className="min-w-0"><h2 className="truncate font-bold">{client.name}</h2><p className="truncate text-sm text-slate-500">{client.phone}</p></div></div><p className="mt-4 truncate text-sm text-slate-600">{client.email || 'No email supplied'}</p></Link>)}{!clients.length && <p className="text-slate-500">No clients found.</p>}</section>}
    <PaginationControls pagination={pagination} itemName="clients" onPageChange={setPage} />
  </div>{showCreate && <Modal title="Add client" onClose={() => setShowCreate(false)}><ClientForm onCancel={() => setShowCreate(false)} onSaved={async () => { setShowCreate(false); setPage(1); await loadClients() }} /></Modal>}</main>
}
