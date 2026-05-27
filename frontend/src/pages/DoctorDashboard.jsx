import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import api from '../utils/axios'
import DoctorLayout from '../components/DoctorLayout'

// Format an ISO datetime as e.g. "5 Oct 2024"
const formatBookingDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

const StatCard = ({ icon, value, label }) => (
  <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 hover:shadow-sm transition-shadow">
    <div className="w-12 h-12 flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-2xl font-semibold text-gray-700">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    try {
      const res = await api.get('/appointments/mine')
      setAppointments(res.data || [])
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    setBusyId(id)
    try {
      await api.patch(`/appointments/${id}`, { status })
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status } : a)))
      toast.success(`Appointment ${status}`)
    } catch {
      toast.error('Could not update appointment')
    } finally {
      setBusyId(null)
    }
  }

  // Derived stats
  const { earnings, appointmentCount, patientCount, latest } = useMemo(() => {
    // active appointments = everything that hasn't been cancelled/rejected
    const active = appointments.filter(a => a.status !== 'cancelled')
    const earnings = active
      .filter(a => a.status === 'completed' || a.paid)
      .reduce((sum, a) => sum + (Number(a.fees) || 0), 0)
    // only upcoming appointments are counted (exclude completed & cancelled)
    const appointmentCount = appointments.filter(a => (a.status || 'upcoming') === 'upcoming').length
    const patientCount = new Set(active.map(a => a.patientEmail)).size
    // most recently booked first (newest booking on top)
    const latest = [...appointments]
      .sort((a, b) => new Date(b.createdAt || b.dateTime || 0) - new Date(a.createdAt || a.dateTime || 0))
      .slice(0, 5)
    return { earnings, appointmentCount, patientCount, latest }
  }, [appointments])

  return (
    <DoctorLayout>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Earnings"
          value={loading ? '—' : `$ ${earnings}`}
          icon={<img src={assets.earning_icon} alt="Earnings" className="w-10 h-10 object-contain" />}
        />
        <StatCard
          label="Appointments"
          value={loading ? '—' : appointmentCount}
          icon={
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          label="Patients"
          value={loading ? '—' : patientCount}
          icon={
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          }
        />
      </div>

      {/* Latest Bookings */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-200">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <h2 className="font-semibold text-gray-800">Latest Bookings</h2>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-500">Loading bookings…</p>
        ) : latest.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No bookings yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {latest.map(a => {
              const status = a.status || 'upcoming'
              const isBusy = busyId === a.id
              return (
                <div key={a.id} className="flex items-center gap-4 px-6 py-3.5">
                  <img
                    src={a.patientImage || assets.upload_area}
                    alt={a.patientName}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{a.patientName}</p>
                    <p className="text-sm text-gray-500">Booking on {formatBookingDate(a.dateTime)}</p>
                  </div>

                  {status === 'upcoming' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStatus(a.id, 'cancelled')}
                        disabled={isBusy}
                        title="Cancel"
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setStatus(a.id, 'completed')}
                        disabled={isBusy}
                        title="Mark completed"
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-sm font-medium capitalize ${
                        status === 'completed' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {status}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}

export default DoctorDashboard
