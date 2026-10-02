import type { PaginationMeta } from '../../types/pagination'

type Props = { pagination: PaginationMeta | null; itemName: string; onPageChange: (page: number) => void }

export default function PaginationControls({ pagination, itemName, onPageChange }: Props) {
  if (!pagination) return null
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} {itemName}</p><div className="flex gap-2"><button type="button" disabled={!pagination.hasPreviousPage} onClick={() => onPageChange(pagination.page - 1)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><button type="button" disabled={!pagination.hasNextPage} onClick={() => onPageChange(pagination.page + 1)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Next</button></div></div>
}
