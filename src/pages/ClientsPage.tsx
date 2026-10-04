import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import ClientForm from '../components/clients/ClientForm'
import Modal from '../components/common/Modal'
import PaginationControls from '../components/common/paginationControl'
import { apiRequest } from '../service/api'
import type { PaginatedResponse, PaginationMeta } from '../types/pagination'
import { formatName } from '../utils/formatName'

export type Client = {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  gender?: string
  image?: string | null
  createdAt?: string
}

type Props = { onLogout: () => void }

function initials(name: string) {
  return formatName(name)
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

function formatDate(value?: string) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function displayGender(value?: string) {
  if (!value) return 'Not specified'
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export default function ClientsPage({ onLogout }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const loadClients = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const query = new URLSearchParams({ page: String(page), limit: '10' })
      if (search) query.set('search', search)

      const response = await apiRequest<PaginatedResponse<Client>>(
        `/clients?${query.toString()}`,
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

  useEffect(() => { void loadClients() }, [loadClients])

  const clientsWithEmail = clients.filter((client) => Boolean(client.email)).length
  const clientsWithAddress = clients.filter((client) => Boolean(client.address)).length
  const recentlyAdded = clients.filter((client) => {
    if (!client.createdAt) return false
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    return new Date(client.createdAt).getTime() >= thirtyDaysAgo
  }).length

  return (
    <main className="min-h-full px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#778f83]">Customer directory</p>
            <h1 className="mt-1 font-display text-4xl text-[#263d47]">Manage clients</h1>
            <p className="mt-1 text-sm text-[#75817c]">Manage customer profiles, contact details and work history.</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(38,61,71,0.18)] transition hover:bg-[#36515b]">
            + Add client
          </button>
        </header>

        {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total clients" value={pagination?.total ?? clients.length} note="Across your customer directory" icon="♙" tone="sage" />
          <SummaryCard label="Visible this page" value={clients.length} note="Current search results" icon="▤" tone="gold" chart />
          <SummaryCard label="Complete contacts" value={clientsWithEmail} note="Clients with an email address" icon="@" tone="sage" />
          <SummaryCard label="Recently added" value={recentlyAdded} note={`${clientsWithAddress} with a saved address`} icon="+" tone="gold" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe4e0] bg-white/90 shadow-[0_12px_35px_rgba(45,58,55,0.08)]">
          <div className="flex flex-col gap-4 border-b border-[#e7ebe8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-2xl text-[#263d47]">All clients</h2>
              <p className="mt-1 text-xs text-[#89928d]">Open a customer to manage their orders and measurements.</p>
            </div>
            <label className="flex w-full items-center gap-3 rounded-xl border border-[#d9dfdb] bg-[#fafbf9] px-4 py-3 transition focus-within:border-[#8fa397] focus-within:ring-4 focus-within:ring-[#778f83]/10 lg:max-w-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-[#77857e] stroke-2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" strokeLinecap="round" /></svg>
              <span className="sr-only">Search clients</span>
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, phone, email or address" className="w-full bg-transparent text-sm text-[#263d47] placeholder:text-[#929b96] focus:outline-none" />
            </label>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm font-semibold text-[#67756f]">Loading clients…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left text-sm">
                <thead className="bg-[#f5f6f3] text-[#6f7b75]">
                  <tr>
                    {['Customer', 'Phone', 'Email', 'Address', 'Gender', 'Date added'].map((heading) => <th key={heading} className="p-4 text-xs font-extrabold uppercase tracking-wider">{heading}</th>)}
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-t border-[#edf0ed] transition hover:bg-[#f7f8f5]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {client.image ? <img src={client.image} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#edf2ef]" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#e4eae5] to-[#bdcbbf] text-xs font-extrabold text-[#314b43] ring-2 ring-white">{initials(client.name)}</span>}
                          <span className="font-bold text-[#263d47]">{formatName(client.name)}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap text-[#596861]">{client.phone}</td>
                      <td className="p-4"><span className="block max-w-55 truncate text-[#66736d]">{client.email || 'No email supplied'}</span></td>
                      <td className="p-4"><span className="block max-w-60 truncate text-[#66736d]">{client.address || 'No address supplied'}</span></td>
                      <td className="p-4"><span className="rounded-full border border-[#d6e0da] bg-[#edf2ef] px-3 py-1 text-xs font-semibold text-[#557466]">{displayGender(client.gender)}</span></td>
                      <td className="p-4 whitespace-nowrap text-[#66736d]">{formatDate(client.createdAt)}</td>
                      <td className="p-4 text-right"><Link to={`/clients/${client.id}`} className="inline-flex rounded-lg border border-[#c8d4cd] px-3 py-2 text-xs font-bold text-[#557466] transition hover:bg-[#edf2ef]">View details</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!clients.length && <p className="p-10 text-center text-[#75817c]">No clients found.</p>}
            </div>
          )}
        </section>

        <PaginationControls pagination={pagination} itemName="clients" onPageChange={setPage} />
      </div>

      {showCreate && (
        <Modal title="Add client" onClose={() => setShowCreate(false)}>
          <ClientForm onCancel={() => setShowCreate(false)} onSaved={async () => { setShowCreate(false); setPage(1); await loadClients() }} />
        </Modal>
      )}
    </main>
  )
}

type SummaryCardProps = {
  label: string
  value: number
  note: string
  icon: string
  tone: 'sage' | 'gold'
  chart?: boolean
}

function SummaryCard({ label, value, note, icon, tone, chart = false }: SummaryCardProps) {
  const toneStyle = tone === 'gold' ? 'bg-[#f2ebdc] text-[#866d40]' : 'bg-[#edf2ef] text-[#557466]'

  return (
    <article className="rounded-2xl border border-[#e1e5e1] bg-white/90 p-5 shadow-[0_8px_24px_rgba(45,58,55,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#7c8781]">{label}</p><p className="mt-2 font-display text-3xl text-[#263d47]">{value}</p></div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg font-bold ${toneStyle}`}>{icon}</span>
      </div>
      {chart ? <div className="mt-4 flex h-8 items-end gap-1" aria-hidden="true">{[38, 62, 48, 82, 57, 90, 70].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#778f83]" style={{ height: `${height}%`, opacity: 0.44 + index * 0.07 }} />)}</div> : <p className="mt-3 text-xs text-[#89928d]">{note}</p>}
    </article>
  )
}
