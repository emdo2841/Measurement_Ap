import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import AppFooter from './AppFooter'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import './app-shell.css'

type AppLayoutProps = {
  onLogout: () => void
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost/api/v1'

export default function AppLayout({
  onLogout,
}: AppLayoutProps) {
  const { pathname } = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    const token = localStorage.getItem('accessToken')

    try {
      setLoggingOut(true)

      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } finally {
      localStorage.removeItem('accessToken')
      setLoggingOut(false)
      onLogout()
    }
  }

  return (
    <div className="app-shell min-h-screen bg-[#f4f2ec] text-[#263d47]">
      <AppHeader
        menuOpen={menuOpen}
        onMenuToggle={() =>
          setMenuOpen((current) => !current)
        }
      />

      <AppSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      <div className="flex min-h-[calc(100vh-4.5rem)] min-w-0 flex-col lg:pl-66">
        <div
          key={pathname}
          className="min-w-0 flex-1"
          onClick={() => {
            if (menuOpen) setMenuOpen(false)
          }}
        >
          <Outlet />
        </div>

        <AppFooter />
      </div>
    </div>
  )
}