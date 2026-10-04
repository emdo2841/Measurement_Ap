import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f2ec] px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-white/80 bg-white/80 p-8 text-center shadow-[0_22px_55px_rgba(45,58,55,0.1)] backdrop-blur-sm sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf2ef] text-[#4f6f61]">
          <svg viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]" aria-hidden="true">
            <path d="M9 3h6l1 4 3 3-2 11H7L5 10l3-3 1-4Z" />
            <path d="M9 3c.6 1 1.6 1.5 3 1.5S14.4 4 15 3M8 7h8" />
          </svg>
        </div>

        <p className="mt-6 font-display text-8xl leading-none text-[#b6975a]">404</p>
        <h1 className="mt-4 font-display text-4xl text-[#263d47]">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#75817c]">
          The page you requested does not exist, or it may have been moved.
        </p>
        <Link to="/dashboard" className="mt-7 inline-flex rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(38,61,71,0.18)] transition hover:bg-[#36515b]">
          Return to dashboard
        </Link>
      </section>
    </main>
  )
}
