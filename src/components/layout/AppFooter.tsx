import { Link } from 'react-router-dom'

const legalLinks = [
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
  { label: 'Cookies', to: '/cookies' },
  { label: 'Acceptable use', to: '/acceptable-use' },
]

export default function AppFooter() {
  return (
    <footer className="border-t border-[#dfe4e0] bg-white/90">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-[#66736d]">
              © {new Date().getFullYear()} EJ TailorPro. Built for tailors and fashion designers by EJ Tech Software Solutions.
            </p>
            <p className="mt-1 text-xs text-[#929b96]">All rights reserved.</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Footer navigation">
            <Link to="/settings" className="text-[#607d6f] transition hover:text-[#263d47]">Settings</Link>
            <Link to="/dashboard" className=" text-[#607d6f] transition hover:text-[#263d47]">Dashboard</Link>
            {legalLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-[#607d6f] transition hover:text-[#263d47]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
