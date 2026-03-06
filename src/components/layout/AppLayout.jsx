import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, FileText, LogOut, User,
  Zap, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const Sidebar = () => (
    <aside className="w-64 min-h-screen bg-ink-900 border-r border-ink-800 flex flex-col p-4 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 mb-4">
        <div className="w-8 h-8 bg-acid rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-ink-950" fill="currentColor" />
        </div>
        <span className="font-display font-extrabold text-white text-lg tracking-tight">InvoiceFlow</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-30" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-ink-800 pt-4 mt-4">
        <div className="flex items-center gap-3 px-4 py-2 mb-1">
          <div className="w-8 h-8 bg-ink-700 rounded-full flex items-center justify-center text-xs font-display font-bold text-acid">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-600 text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-ink-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-coral hover:text-coral hover:bg-coral/10">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-ink-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-ink-900 border-b border-ink-800">
          <button onClick={() => setMobileOpen(true)} className="text-ink-300 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-acid rounded flex items-center justify-center">
              <Zap size={12} className="text-ink-950" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-white">InvoiceFlow</span>
          </div>
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
