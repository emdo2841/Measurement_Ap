import { Link } from 'react-router-dom'

export default function AppFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} TailorPro. Built for tailors and fashion designers.</p>
        <div className="flex items-center gap-4">
          <Link to="/settings" className="hover:text-blue-600">Settings</Link>
          <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        </div>
      </div>
    </footer>
  )
}
