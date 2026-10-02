import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

type AppHeaderProps = {
  onLogout: () => Promise<void> | void
}

const navigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Clients', path: '/clients' },
  { label: 'Orders', path: '/orders' },
  { label: 'Measurements', path: '/measurements' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Settings', path: '/settings' },
]

function isCurrentPage(pathname: string, path: string) {
  if (path === '/dashboard') return pathname === '/dashboard'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function AppHeader({ onLogout }: AppHeaderProps) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    try {
      setLoggingOut(true)
      await onLogout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-sm">
            T
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight text-slate-900">TailorPro</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">Workshop manager</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" aria-hidden="true">
            {menuOpen ? <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>

        <div className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-16 flex-col gap-2 border-b border-slate-200 bg-white p-4 shadow-lg lg:static lg:flex lg:flex-row lg:items-center lg:border-0 lg:p-0 lg:shadow-none`}>
          <nav className="flex flex-col gap-1 lg:flex-row" aria-label="Main navigation">
            {navigation.map((item) => {
              const active = isCurrentPage(pathname, item.path)

              if (active) {
                return (
                  <span
                    key={item.path}
                    aria-current="page"
                    className="cursor-default rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
                  >
                    {item.label}
                  </span>
                )
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60 lg:ml-2"
          >
            {loggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>
    </header>
  )
}
