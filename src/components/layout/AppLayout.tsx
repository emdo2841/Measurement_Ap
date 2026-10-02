import { Outlet } from 'react-router-dom'
import AppFooter from './AppFooter'
import AppHeader from './AppHeader'

type AppLayoutProps = { onLogout: () => void }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1'

export default function AppLayout({ onLogout }: AppLayoutProps) {
  async function handleLogout() {
    const token = localStorage.getItem('accessToken')
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
      }
    } finally {
      localStorage.removeItem('accessToken')
      onLogout()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <AppHeader onLogout={handleLogout} />
      <div className="flex-1">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  )
}
