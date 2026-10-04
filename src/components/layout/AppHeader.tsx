import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { apiRequest } from '../../service/api'

type AppHeaderProps = {
  menuOpen: boolean
  onMenuToggle: () => void
}

type UserProfile = {
  id: string
  name: string
  email: string
  image?: string | null
}

function extractProfile(payload: unknown): UserProfile | null {
  if (typeof payload !== 'object' || payload === null) return null
  const wrapped = payload as { data?: unknown }
  const value = wrapped.data ?? payload
  return typeof value === 'object' && value !== null ? (value as UserProfile) : null
}

function initials(name?: string) {
  if (!name) return 'TP'
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

export default function AppHeader({ menuOpen, onMenuToggle }: AppHeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    void apiRequest('/users/profile')
      .then((payload) => {
        if (active) setUser(extractProfile(payload))
      })
      .catch(() => {
        // The protected route handles expired sessions. The header can safely
        // fall back to initials while profile information is unavailable.
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    function closeProfileMenu(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }

    document.addEventListener('mousedown', closeProfileMenu)
    return () => document.removeEventListener('mousedown', closeProfileMenu)
  }, [])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = search.trim()
    if (!value) return

    const section = pathname.startsWith('/orders')
      ? '/orders'
      : pathname.startsWith('/measurements')
        ? '/measurements'
        : '/clients'

    navigate(`${section}?search=${encodeURIComponent(value)}`)
    setSearch('')
  }

  return (
    <header className="sticky top-0 z-50 h-18 border-b border-[#dfe3df] bg-[#fbfaf7]/95 shadow-[0_4px_24px_rgba(38,50,56,0.06)] backdrop-blur-xl">
      <div className="flex h-full items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d9dedb] bg-white text-[#31464f] transition hover:bg-[#f0f3ef] lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="application-sidebar"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" aria-hidden="true">
            {menuOpen ? <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
          </svg>
        </button>

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
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a8173]">Measure · Create · Deliver</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-2xl md:block">
          <label className="flex h-11 items-center gap-3 rounded-2xl border border-[#dde3e1] bg-[#f2f4f2]/90 px-4 text-[#718078] transition focus-within:border-[#9eafa6] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(119,143,131,0.1)]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Search clients, orders or measurements</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search clients, orders, measurements…"
              className="w-full bg-transparent text-sm font-medium text-[#263d47] placeholder:text-[#929b96] focus:outline-none"
            />
            <kbd className="hidden rounded-md border border-[#d8ddda] bg-white px-2 py-1 text-[10px] font-bold text-[#8a928e] xl:block">Enter</kbd>
          </label>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/calendar"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#52646b] transition hover:bg-[#edf1ee] hover:text-[#263d47]"
            aria-label="View calendar and reminders"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#fbfaf7] bg-[#b76d5d]" />
          </Link>

          <span className="hidden h-8 w-px bg-[#dfe3df] sm:block" />

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className="flex items-center gap-2 rounded-2xl p-1.5 text-left transition hover:bg-[#eef1ee] sm:gap-3 sm:pr-3"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              {user?.image ? (
                <img src={user.image} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe7e2] text-xs font-extrabold text-[#314b43] ring-2 ring-white">
                  {initials(user?.name)}
                </span>
              )}

              <span className="hidden min-w-0 lg:block">
                <span className="block max-w-38 truncate text-xs font-extrabold text-[#263d47]">{user?.name ?? 'TailorPro User'}</span>
                <span className="mt-0.5 block text-[10px] font-medium text-[#808b86]">Tailor / Designer</span>
              </span>

              <svg viewBox="0 0 24 24" className={`hidden h-4 w-4 fill-none stroke-current stroke-2 text-[#7a8580] transition lg:block ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-58 overflow-hidden rounded-2xl border border-[#dfe3df] bg-white p-2 shadow-[0_18px_45px_rgba(31,45,52,0.15)]">
                <div className="border-b border-[#edf0ed] px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-[#263d47]">{user?.name ?? 'TailorPro User'}</p>
                  <p className="mt-0.5 truncate text-xs text-[#7e8984]">{user?.email ?? 'Your account'}</p>
                </div>
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-semibold text-[#53636a] transition hover:bg-[#f0f3f0] hover:text-[#263d47]">Profile & settings</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
