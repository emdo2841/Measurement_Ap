import { Link, NavLink, Outlet } from 'react-router-dom'

const legalNavigation = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Cookies', to: '/cookies' },
  { label: 'Acceptable use', to: '/acceptable-use' },
]

export default function PublicLegalLayout() {
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'))
  const accountPath = isAuthenticated ? '/dashboard' : '/'
  const accountLabel = isAuthenticated ? 'Dashboard' : 'Sign in'

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f2ec] text-[#263d47]">
      <header className="sticky top-0 z-40 border-b border-[#dfe4e0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-3" aria-label="TailorPro dashboard">
          <div className="h-14 w-14 overflow-hidden rounded-xl">
            <img
              src="ej_logo.png"
              alt="EJ TailorPro"
              className="h-full w-full object-cover"
            />
        </div>

          <span className="hidden sm:block">
            <span className="block font-display text-[21px] font-semibold leading-5 tracking-[-0.035em] text-[#1e323c]">
              EJ Tailor<span className="text-[#778f83]">Pro</span>
            </span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a8173]">Workshop manager</span>
          </span>
        </Link>

          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-[#edf0ed] pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0" aria-label="Legal navigation">
            {legalNavigation.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${isActive ? 'cursor-default bg-[#edf2ef] text-[#466455]' : 'text-[#69766f] hover:bg-[#f4f6f3] hover:text-[#263d47]'}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to={accountPath} className="rounded-lg bg-[#263d47] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#36515b]">{accountLabel}</Link>
        </div>
      </header>

      <div className="flex-1"><Outlet /></div>

      <footer className="border-t border-[#dfe4e0] bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs leading-5 text-[#66736d]">© {new Date().getFullYear()} EJ TailorPro. Built by EJ Tech Software Solutions.</p>
            <p className="text-[11px] text-[#929b96]">All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs" aria-label="Legal footer navigation">
            {legalNavigation.map((item) => <Link key={item.to} to={item.to} className="font-semibold text-[#607d6f] hover:text-[#263d47]">{item.label}</Link>)}
            <Link to={accountPath} className="font-semibold text-[#607d6f] hover:text-[#263d47]">{accountLabel}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
