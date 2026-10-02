import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="text-center">
        <p className="text-7xl font-black text-blue-600">404</p>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-2 text-slate-500">
          The page you requested does not exist.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  )
}