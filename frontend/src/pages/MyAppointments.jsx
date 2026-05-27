import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import api from '../utils/axios'
import { fetchDoctors } from '../utils/doctors'
import PaymentModal from '../components/PaymentModal'

const TABS = ['upcoming', 'completed', 'cancelled']

const formatDateTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} | ${time}`
}

const MyAppointments = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [payAppt, setPayAppt] = useState(null) // appointment currently being paid
  const [doctors, setDoctors] = useState([]) // backend (admin-added) + seed doctors

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments/mine')
      setAppointments(res.data || [])
    } catch (error) {
      console.error('Failed to load appointments:', error)
      toast.error('Failed to load your appointments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAppointments() }, [])
  useEffect(() => { fetchDoctors().then(setDoctors) }, [])

  // map a doctorId so we can show the doctor image / fallback details
  const doctorOf = (a) => doctors.find(d => d._id === a.doctorId) || null

  const counts = useMemo(() => {
    const c = { upcoming: 0, completed: 0, cancelled: 0 }
    appointments.forEach(a => {
      const s = a.status || 'upcoming'
      if (c[s] !== undefined) c[s] += 1
    })
    return c
  }, [appointments])

  const filtered = appointments
    .filter(a => (a.status || 'upcoming') === activeTab)
    .sort((x, y) => new Date(y.dateTime) - new Date(x.dateTime))

  const handleCancel = async (appt) => {
    const willRefund = appt.paid
    const confirmMsg = willRefund
      ? 'Cancel this appointment? Your payment will be refunded to your original payment method within 5–7 working days.'
      : 'Are you sure you want to cancel this appointment?'
    if (!window.confirm(confirmMsg)) return
    setBusyId(appt.id)
    try {
      const res = await api.patch(`/appointments/${appt.id}`, { status: 'cancelled' })
      // server returns the updated appointment incl. any refund details
      const updated = res.data || {}
      setAppointments(prev => prev.map(a => (a.id === appt.id ? { ...a, ...updated, status: 'cancelled' } : a)))
      if (updated.refundIssued) {
        toast.success('Appointment cancelled — refund initiated (5–7 working days)')
      } else {
        toast.success('Appointment cancelled')
      }
    } catch {
      toast.error('Could not cancel appointment')
    } finally {
      setBusyId(null)
    }
  }

  // open the secure checkout for this appointment
  const handlePay = (appt) => setPayAppt(appt)

  // called by PaymentModal once the backend confirms the payment
  const handlePaid = (appt, receipt) => {
    setAppointments(prev => prev.map(a => (a.id === appt.id ? { ...a, paid: true } : a)))
    setPayAppt(null)
    toast.success(`Payment successful — ${receipt?.txnId || 'transaction confirmed'}`)
  }

  return (
    <div className='py-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-2xl font-semibold text-gray-700 pb-3 border-b border-gray-300'>
          My appointments
        </h1>

        {/* Tabs */}
        <div className='flex gap-2 mt-6 mb-2'>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {loading ? (
          <p className='py-12 text-center text-gray-500'>Loading appointments…</p>
        ) : filtered.length === 0 ? (
          <div className='text-center py-16'>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No {activeTab} appointments</h3>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/doctors')}
                className='mt-2 bg-primary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors'
              >
                Find Doctors
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map(appt => {
              const doc = doctorOf(appt)
              const image = doc?.image || appt.doctorImage || assets.upload_area
              const address = appt.doctorAddress || doc?.address || {}
              const isBusy = busyId === appt.id
              return (
                <div
                  key={appt.id}
                  className='grid grid-cols-[1fr_2fr] sm:grid-cols-[150px_1fr_auto] gap-4 sm:gap-6 py-6 border-b border-gray-200'
                >
                  {/* Doctor image */}
                  <img
                    className='w-32 h-32 bg-indigo-50 rounded object-cover'
                    src={image}
                    alt={appt.doctorName}
                  />

                  {/* Details */}
                  <div className='text-sm text-gray-600'>
                    <p className='text-base font-semibold text-gray-800'>{appt.doctorName}</p>
                    <p>{appt.speciality || doc?.speciality || ''}</p>
                    <p className='mt-2 font-medium text-gray-700'>Address:</p>
                    <p>{address.line1 || '—'}</p>
                    <p>{address.line2 || ''}</p>
                    <p className='mt-2'>
                      <span className='font-medium text-gray-700'>Date &amp; Time: </span>
                      {formatDateTime(appt.dateTime)}
                    </p>
                    <p>
                      <span className='font-medium text-gray-700'>Consultation Fee: </span>
                      ${Number(appt.fees || 0).toLocaleString('en-US')}
                    </p>
                    <div className='mt-2 flex items-center gap-2'>
                      {appt.paid && appt.refundStatus !== 'processing' && (
                        <span className='inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700'>
                          Paid
                        </span>
                      )}
                      {appt.refundStatus === 'processing' && (
                        <span className='inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700'>
                          Refund initiated
                        </span>
                      )}
                      {appt.status === 'completed' && (
                        <span className='inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700'>
                          Completed
                        </span>
                      )}
                      {appt.status === 'cancelled' && (
                        <span className='inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700'>
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex flex-col gap-2 justify-center col-span-2 sm:col-span-1'>
                    {activeTab === 'upcoming' && (
                      <>
                        {!appt.paid && (
                          <button
                            onClick={() => handlePay(appt)}
                            disabled={isBusy}
                            className='text-sm text-gray-600 text-center sm:min-w-48 py-2 border border-gray-300 rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50'
                          >
                            Pay Online
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(appt)}
                          disabled={isBusy}
                          className='text-sm text-gray-600 text-center sm:min-w-48 py-2 border border-gray-300 rounded hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50'
                        >
                          Cancel appointment
                        </button>
                      </>
                    )}
                    {activeTab === 'completed' && appt.doctorId && (
                      <button
                        onClick={() => navigate(`/appointment/${appt.doctorId}`)}
                        className='text-sm text-gray-600 text-center sm:min-w-48 py-2 border border-gray-300 rounded hover:bg-primary hover:text-white transition-colors'
                      >
                        Book Again
                      </button>
                    )}
                    {activeTab === 'cancelled' && (
                      <>
                        <p className='text-sm text-red-400 text-center sm:min-w-48 py-2 border border-red-200 rounded'>
                          Appointment cancelled
                        </p>
                        {appt.refundStatus === 'processing' && (
                          <div className='sm:min-w-48 mt-1 px-3 py-2 rounded bg-green-50 border border-green-200 text-xs text-green-700'>
                            <p className='font-medium'>
                              Refund of ${Number(appt.refundAmount || appt.fees || 0).toLocaleString('en-US')} initiated
                            </p>
                            <p className='mt-0.5 text-green-600'>
                              The amount will be credited back to your original payment method within 5–7 working days.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PaymentModal
        open={!!payAppt}
        appointment={payAppt}
        onClose={() => setPayAppt(null)}
        onSuccess={(receipt) => handlePaid(payAppt, receipt)}
      />
    </div>
  )
}

export default MyAppointments
