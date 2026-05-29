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

      <div className="sm:bg-white sm:border sm:border-gray-200 sm:rounded-xl sm:overflow-hidden">
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
          <div className="space-y-3 sm:space-y-0 sm:divide-y sm:divide-gray-100">
            {[...appointments]
              .sort((a, b) => new Date(b.createdAt || b.dateTime || 0) - new Date(a.createdAt || a.dateTime || 0))
              .map((a, index) => {
              const status = a.status || 'upcoming'
              const isBusy = busyId === a.id

              const paymentBadge = (
                <span className="inline-flex shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full border border-gray-300 text-gray-500">
                  {a.paid ? 'ONLINE' : 'CASH'}
                </span>
              )

              const actions = status === 'upcoming' ? (
                <div className="flex items-center gap-1.5">
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
                </div>
              ) : (
                <span
                  className={`text-sm font-medium capitalize ${
                    status === 'completed' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {status}
                </span>
              )

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-primary shadow-sm px-3.5 py-3.5 text-sm text-gray-700 sm:border-0 sm:rounded-none sm:shadow-none sm:px-6 sm:py-4"
                >
                  {/* Desktop / tablet table row */}
                  <div className="hidden sm:grid sm:grid-cols-[0.4fr_2fr_1fr_0.6fr_2fr_0.7fr_1.2fr] gap-2 items-center">
                    <span className="text-gray-500">{index + 1}</span>

                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={a.patientImage || assets.upload_area}
                        alt={a.patientName}
                        className="w-8 h-8 rounded-full object-cover bg-gray-100"
                      />
                      <span className="truncate">{a.patientName || '—'}</span>
                    </div>

                    <span>{paymentBadge}</span>
                    <span>{a.patientAge || '—'}</span>
                    <span>{formatDateTime(a.dateTime)}</span>
                    <span>${a.fees ?? 0}</span>

                    {actions}
                  </div>

                  {/* Mobile card */}
                  <div className="sm:hidden">
                    {/* Row 1: number, patient, payment */}
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-indigo-50 text-primary font-semibold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <img
                        src={a.patientImage || assets.upload_area}
                        alt={a.patientName}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{a.patientName || '—'}</p>
                        <p className="text-xs text-gray-500">Age: {a.patientAge || '—'}</p>
                      </div>
                      {paymentBadge}
                    </div>

                    {/* Row 2: date, fees, action/status */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-2 min-w-0 flex-1 text-gray-600">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        <span className="truncate">{formatDateTime(a.dateTime)}</span>
                      </span>
                      <span className="font-semibold text-gray-800 shrink-0">${a.fees ?? 0}</span>
                      <div className="shrink-0">{actions}</div>
                    </div>
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
