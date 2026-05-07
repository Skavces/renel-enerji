import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Star,
  BarChart2,
  ShieldCheck,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import Logo from '../../components/Logo'

const NAV = [
  { to: '/admin', label: 'Ana Sayfa', icon: LayoutDashboard, match: (p) => p === '/admin' },
  { to: '/admin/projeler', label: 'Projeler', icon: FolderOpen, match: (p) => p.startsWith('/admin/projeler') },
  { to: '/admin/referanslar', label: 'Referanslar', icon: Star, match: (p) => p.startsWith('/admin/referanslar') },
  { to: '/admin/analitik', label: 'Analitik', icon: BarChart2, match: (p) => p.startsWith('/admin/analitik') },
  { to: '/admin/2fa', label: '2FA', icon: ShieldCheck, match: (p) => p.startsWith('/admin/2fa') },
]

export default function AdminLayout() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Navbar */}
      <header className="bg-transparent shrink-0">
        <div className="max-w-6xl mx-auto flex items-center h-24 px-6 gap-8">
          {/* Logo */}
          <Link to="/admin" className="shrink-0">
            <Logo className="h-20 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5 flex-1 justify-center">
            {NAV.map(({ to, label, icon: Icon, match }) => {
              const active = match(pathname)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-[#448834] text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-150"
            >
              <ExternalLink size={17} className="shrink-0" />
              <span>Siteyi Gör</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
            >
              <LogOut size={17} className="shrink-0" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </header>
      <div className="h-1.5 bg-gradient-to-r from-[#f5ce31] via-[#448834] to-[#f5ce31] shrink-0" />

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
