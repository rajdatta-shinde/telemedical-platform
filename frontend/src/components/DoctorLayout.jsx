import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { RiDashboardLine, RiCalendarCheckLine, RiUserLine, RiCalendarScheduleLine } from 'react-icons/ri'
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    // fixed inset-0 breaks the panel out of the App's mx-[10%] wrapper
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      {/* Top header */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 z-40">
        <div className="flex items-center gap-3">
          <img src={assets.logo} alt="Prescripto" className="h-9 w-auto" />
          <span className="text-xs font-medium text-gray-500 border border-gray-400 rounded-full px-3 py-0.5">
            Doctor
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-primary text-white text-sm px-8 py-2 rounded-full hover:bg-primary/90 transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-16 left-0 bottom-0 w-16 sm:w-64 bg-white border-r border-gray-200 py-6 z-30">
        <ul className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <li key={path}>
                <Link
                  to={path}
                  className={`flex items-center gap-3 px-3 sm:px-6 py-3.5 text-sm transition-colors ${
                    active
                      ? 'bg-blue-50 border-r-4 border-primary text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="text-xl shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </aside>

      {/* Content */}
      <main className="ml-16 sm:ml-64 pt-16">
        <div className="p-4 sm:p-8 max-w-5xl">{children}</div>
      </main>
    </div>
  )
}

export default DoctorLayout
