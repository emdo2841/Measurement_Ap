import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/common/Modal'
import ClientForm from '../components/clients/ClientForm'
import OrderForm from '../components/orders/OrderForm'
import MeasurementForm from '../components/measurements/MeasurementForm'
import { apiRequest } from '../service/api'
import type { Client } from './ClientsPage'

type Order = { id: string; status: string; dueDate?: string | null; totalAmount?: number | null }
type Measurement = { id: string; title: string; unit: string; data: Record<string, number> }
type ClientDetails = Client & {
    orders?: Order[]
    measurements?: Measurement[]
}
type Props = { onLogout: () => void }

export default function ClientDetailsPage({ onLogout }: Props) {
    const { id } = useParams()
    const navigate = useNavigate()
    const [client, setClient] = useState<ClientDetails | null>(null)
    const [modal, setModal] = useState<'edit' | 'order' | 'measurement' | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadClient = useCallback(async () => {
        if (!id) return
        try {
            setLoading(true)
            setClient(await apiRequest<ClientDetails>(`/clients/${id}`))
            setError('')
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : 'Unable to load client.'
            setError(message)
            if (message.includes('session')) onLogout()
        } finally { setLoading(false) }
    }, [id, onLogout])

    useEffect(() => { void loadClient() }, [loadClient])

    async function deleteClient() {
        if (!id || !window.confirm('Delete this client and all associated records?')) return
        await apiRequest(`/clients/${id}`, { method: 'DELETE' })
        navigate('/clients', { replace: true })
    }

    if (loading) return <p className="p-8">Loading client...</p>
    if (!client) return <p className="p-8 text-red-600">{error || 'Client not found.'}</p>

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div><Link to="/clients" className="text-sm font-semibold text-blue-600">← Clients</Link><h1 className="mt-2 text-3xl font-black">{client.name}</h1><p className="text-slate-500">{client.phone} · {client.email || 'No email'}</p></div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setModal('measurement')} className="rounded-xl border border-blue-600 px-4 py-2 text-blue-600">Add measurement</button>
                        <button onClick={() => setModal('order')} className="rounded-xl bg-blue-600 px-4 py-2 text-white">Add order</button>
                        <button onClick={() => setModal('edit')} className="rounded-xl border border-slate-300 px-4 py-2">Edit</button>
                        <button onClick={() => void deleteClient()} className="rounded-xl border border-red-300 px-4 py-2 text-red-600">Delete</button>
                    </div>
                </header>
                {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold">Measurements</h2>
                                <p className="text-sm text-slate-500">One profile for each garment type.</p>
                            </div>
                             <Link to={`/measurements/client/${client.id}`}
                               className="rounded-xl border border-blue-600 px-4 py-2 text-blue-600"
                             >
                            
                               View all
                            </Link>
                        </div>
                        {client.measurements?.length ? (
                           <div className="mt-4 space-y-3">
                               {client.measurements.slice(0, 4).map((measurement) => (
                                   <Link
                                       key={measurement.id}
                                       to={`/measurements/${measurement.id}`}
                                       className="block rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
                                   >
                                       <div className="flex items-center justify-between gap-3">
                                           <strong>{measurement.title}</strong>
                                           <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                               {measurement.unit}
                                           </span>
                                       </div>
                                       <p className="mt-2 text-sm text-slate-500">
                                           {Object.keys(measurement.data ?? {}).length} measurement fields
                                       </p>
                                   </Link>
                               ))}
                           </div>
                         ) : (
                             <p className="mt-4 text-sm text-slate-500">
                                
                               This client does not have any measurements yet.
                             </p>
                         )}
                     </div>
                
                </section>
            </div>

            {modal === 'edit' && <Modal title="Edit client" onClose={() => setModal(null)}><ClientForm client={client} onCancel={() => setModal(null)} onSaved={async () => { setModal(null); await loadClient() }} /></Modal>}
            {modal === 'order' && <Modal title="Add order" onClose={() => setModal(null)}><OrderForm clients={[client]} onCancel={() => setModal(null)} onCreated={async () => { setModal(null); await loadClient() }} /></Modal>}
            {modal === 'measurement' && <Modal title="Add measurement" onClose={() => setModal(null)}><MeasurementForm clients={[client]} defaultClientId={client.id} onCancel={() => setModal(null)} onCreated={async () => { setModal(null); await loadClient() }} /></Modal>}
         </main>
     )
 }
    

