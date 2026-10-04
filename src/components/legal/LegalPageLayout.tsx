import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  description: string
  lastUpdated: string
  children: ReactNode
}

export const LEGAL_EMAIL = import.meta.env.VITE_LEGAL_EMAIL || 'legal@ejtailorpro.com'

export default function LegalPageLayout({ title, description, lastUpdated, children }: Props) {
  return (
    <main className="min-h-full px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#dfe4e0] bg-white/95 shadow-[0_18px_55px_rgba(45,58,55,0.09)]">
        <header className="border-b border-[#e7ebe8] bg-[#f7f6f1] px-6 py-8 sm:px-10">
          <Link to="/dashboard" className="text-sm font-bold text-[#607d6f] hover:text-[#263d47]">← Return to TailorPro</Link>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-[#8a754d]">Legal</p>
          <h1 className="mt-2 font-display text-4xl text-[#263d47] sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#66736d]">{description}</p>
          <p className="mt-4 text-xs font-semibold text-[#89928d]">Last updated: {lastUpdated}</p>
        </header>

        <div className="legal-content space-y-8 px-6 py-8 text-[15px] leading-7 text-[#52615a] sm:px-10">
          {children}
        </div>

        <footer className="border-t border-[#e7ebe8] bg-[#fafbf9] px-6 py-5 text-sm text-[#748079] sm:px-10">
          Questions about this document? Email <a href={`mailto:${LEGAL_EMAIL}`} className="font-bold text-[#557466] hover:underline">{LEGAL_EMAIL}</a>.
        </footer>
      </article>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="mb-3 font-display text-2xl text-[#263d47]">{title}</h2><div className="space-y-3">{children}</div></section>
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-[#778f83]">{children}</ul>
}
