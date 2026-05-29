import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RiDashboardLine, RiCalendarCheckLine, RiUserLine, RiCalendarScheduleLine, RiMenuLine } from 'react-icons/ri'
import { useAuth } from '../context/AuthContext'
import { assets } from '../assets/assets'

const navItems = [
  { path: '/doctor', icon: RiDashboardLine, label: 'Dashboard' },
  { path: '/doctor/appointments', icon: RiCalendarCheckLine, label: 'Appointments' },
  { path: '/doctor/schedule', icon: RiCalendarScheduleLine, label: 'Schedule' },
  { path: '/doctor/profile', icon: RiUserLine, label: 'Profile' },
]

const DoctorLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close the mobile sidebar whenever the route changes
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    // fixed inset-0 breaks the panel out of the App's mx-[10%] wrapper
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      {/* Top header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-40">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="sm:hidden -ml-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <RiMenuLine className="text-2xl text-gray-700" />
          </button>
          <img src={assets.logo} alt="Prescripto" className="h-9 w-auto" />
          <span className="text-xs font-medium text-gray-500 border border-gray-400 rounded-full px-3 py-0.5">
            Doctor
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-primary text-white text-sm px-5 sm:px-8 py-2 rounded-full hover:bg-primary/90 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Backdrop - mobile only, shown when the sidebar is open */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 top-16 z-20 bg-black/40 sm:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar - hidden off-screen on mobile, always visible from sm up */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 py-6 z-30 transition-transform duration-300 sm:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ul className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-3 px-6 py-3.5 text-sm transition-colors ${
                    active
                      ? 'bg-blue-50 border-r-4 border-primary text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="text-xl shrink-0" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Content - full width on mobile, offset by the sidebar from sm up */}
      <main className="ml-0 sm:ml-64 pt-16">
        <div className="p-4 sm:p-8 max-w-5xl">{children}</div>
      </main>
    </div>
  )
}

export default DoctorLayout
