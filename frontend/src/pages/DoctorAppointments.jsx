import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import api from '../utils/axios'
import DoctorLayout from '../components/DoctorLayout'

// Format an ISO datetime as e.g. "5 Oct 2024, 12:00 PM"
const formatDateTime = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return '—'
  const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date}, ${time}`
}

const DoctorAppointments = () => {
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
      const res = await api.patch(`/appointments/${id}`, { status })
      const updated = res.data || {}
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, ...updated, status } : a)))
      if (updated.refundIssued) {
        toast.success('Appointment cancelled — patient will be refunded within 5–7 working days')
      } else {
        toast.success(`Appointment ${status}`)
      }
    } catch {
      toast.error('Could not update appointment')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <DoctorLayout>
      <h1 className="text-xl font-semibold text-gray-700 mb-4">All Appointments</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="hidden sm:grid sm:grid-cols-[0.4fr_2fr_1fr_0.6fr_2fr_0.7fr_1.2fr] gap-2 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-600">
          <span>#</span>
          <span>Patient</span>
          <span>Payment</span>
          <span>Age</span>
          <span>Date &amp; Time</span>
          <span>Fees</span>
          <span>Action</span>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-gray-500">Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-500">No appointments yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...appointments]
              .sort((a, b) => new Date(b.createdAt || b.dateTime || 0) - new Date(a.createdAt || a.dateTime || 0))
              .map((a, index) => {
              const status = a.status || 'upcoming'
              const isBusy = busyId === a.id
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-2 sm:grid-cols-[0.4fr_2fr_1fr_0.6fr_2fr_0.7fr_1.2fr] gap-2 items-center px-6 py-4 text-sm text-gray-700"
                >
                  <span className="text-gray-500">{index + 1}</span>

                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={a.patientImage || assets.upload_area}
                      alt={a.patientName}
                      className="w-8 h-8 rounded-full object-cover bg-gray-100"
                    />
                    <span className="truncate">{a.patientName || '—'}</span>
                  </div>

                  <span>
                    <span className="inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border border-gray-300 text-gray-500">
                      {a.paid ? 'ONLINE' : 'CASH'}
                    </span>
                  </span>

                  <span>{a.patientAge || '—'}</span>
                  <span>{formatDateTime(a.dateTime)}</span>
                  <span>${a.fees ?? 0}</span>

                  <div className="flex items-center gap-1.5">
                    {status === 'upcoming' ? (
                      <>
                        <button
                          onClick={() => setStatus(a.id, 'cancelled')}
                          disabled={isBusy}
                          title="Cancel"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setStatus(a.id, 'completed')}
                          disabled={isBusy}
                          title="Mark completed"
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </button>
                      </>
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DoctorLayout>
  )
}

export default DoctorAppointments
