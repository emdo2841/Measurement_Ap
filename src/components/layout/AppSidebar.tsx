import { Link, useLocation } from 'react-router-dom'

type AppSidebarProps = {
  open: boolean
  onClose: () => void
  onLogout: () => Promise<void> | void
  loggingOut: boolean
}

type NavigationItem = {
  label: string
  path: string
  icon: 'dashboard' | 'clients' | 'orders' | 'measurements' | 'calendar' | 'settings'
}

const navigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Clients', path: '/clients', icon: 'clients' },
  { label: 'Orders', path: '/orders', icon: 'orders' },
  { label: 'Measurements', path: '/measurements', icon: 'measurements' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
]

function isCurrentPage(pathname: string, path: string) {
  if (path === '/dashboard') return pathname === '/dashboard'
  return pathname === path || pathname.startsWith(`${path}/`)
}

function NavigationIcon({ name }: { name: NavigationItem['icon'] }) {
  const className = 'h-5 w-5 shrink-0 fill-none stroke-current stroke-[1.8]'

  if (name === 'dashboard') return <svg viewBox="0 0 24 24" className={className}><path d="M3 11 12 3l9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></svg>
  if (name === 'clients') return <svg viewBox="0 0 24 24" className={className}><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2M17 11a4 4 0 0 0 0-8M22 21v-2a6 6 0 0 0-3-5.2" /></svg>
  if (name === 'orders') return <svg viewBox="0 0 24 24" className={className}><path d="M7 4h10a2 2 0 0 1 2 2v15H5V6a2 2 0 0 1 2-2Z" /><path d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" /></svg>
  if (name === 'measurements') return <svg viewBox="0 0 24 24" className={className}><path d="m4 15 11-11 5 5L9 20H4v-5Z" /><path d="m12 7 2 2m-5 1 2 2m-5 1 2 2" /></svg>
  if (name === 'calendar') return <svg viewBox="0 0 24 24" className={className}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
  return <svg viewBox="0 0 24 24" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>
}

export default function AppSidebar({ open, onClose, onLogout, loggingOut }: AppSidebarProps) {
  const { pathname } = useLocation()

  return (
    <>
      {open && <button type="button" onClick={onClose} className="fixed inset-0 top-18 z-30 bg-[#1f2f35]/35 backdrop-blur-[2px] lg:hidden" aria-label="Close navigation overlay" />}

      <aside
        id="application-sidebar"
        className={`fixed bottom-0 left-0 top-18 z-40 flex w-66 flex-col border-r border-[#dfe4e0] bg-[#f7f7f3]/98 px-4 py-5 shadow-[12px_0_35px_rgba(45,58,55,0.06)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-4 px-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9a9487]">Workspace</p>
        </div>

        <nav className="space-y-1.5" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = isCurrentPage(pathname, item.path)
            const sharedClass = 'group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm transition'

            if (active) {
              return (
                <span key={item.path} aria-current="page" className={`${sharedClass} cursor-default bg-[#263d47] font-bold text-white shadow-[0_8px_22px_rgba(38,61,71,0.18)]`}>
                  <span className="text-[#d7c396]"><NavigationIcon name={item.icon} /></span>
                  {item.label}
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d7c396]" />
                </span>
              )
            }

            return (
              <Link key={item.path} to={item.path} onClick={onClose} className={`${sharedClass} font-semibold text-[#617069] hover:bg-[#eaeee9] hover:text-[#263d47]`}>
                <span className="text-[#819088] transition group-hover:text-[#536e62]"><NavigationIcon name={item.icon} /></span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-4 pt-6">
          <div className="overflow-hidden rounded-2xl border border-[#dfe4df] bg-white/80 p-4 shadow-sm">
            <div className="mb-3 h-1 w-10 rounded-full bg-[#b6975a]" />
            <p className="font-display text-lg font-semibold leading-tight text-[#263d47]">Craft with confidence.</p>
            <p className="mt-2 text-xs leading-5 text-[#78837e]">Precise measurements create exceptional garments.</p>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d9dedb] bg-white px-4 py-3 text-sm font-bold text-[#53636a] transition hover:border-[#c6cec9] hover:bg-[#edf0ed] hover:text-[#263d47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </aside>
    </>
  )
}
