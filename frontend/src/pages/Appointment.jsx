import React, { useState, useEffect, useCallback } from 'react'
import { assets } from '../assets/assets'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import api from '../utils/axios'
import { fetchDoctors } from '../utils/doctors'
import { isInUnavailable, isUnavailableNow } from '../utils/availability'

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// 30-minute slots from 09:00 to 17:30
const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 9; h <= 17; h++) {
    for (const m of [0, 30]) {
      slots.push({ h, m })
    }
  }
  return slots
})()

const formatSlotLabel = (h, m) => {
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

const Appointment = () => {
  const { docId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [doctor, setDoctor] = useState(null)
  const [doctors, setDoctors] = useState(null) // null = still loading
  const [days, setDays] = useState([])
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [selectedTime, setSelectedTime] = useState(null) // { h, m }
  const [bookedSlots, setBookedSlots] = useState([]) // array of ISO strings
  const [isLoading, setIsLoading] = useState(false)

  // Load doctors from the backend (admin-added) merged with the seed list
  useEffect(() => {
    fetchDoctors().then(setDoctors)
  }, [])

  // Resolve the doctor and build the next 7 days
  useEffect(() => {
    if (!doctors) return // wait for the doctor list to load
    const foundDoctor = doctors.find(doc => doc._id === docId)
    if (!foundDoctor) {
      navigate('/doctors')
      return
    }
    setDoctor(foundDoctor)
    setSelectedDayIdx(0)
    setSelectedTime(null)

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    // If every slot today has already passed, roll the window forward to tomorrow.
    const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1]
    const lastSlotToday = new Date()
    lastSlotToday.setHours(lastSlot.h, lastSlot.m, 0, 0)
    if (Date.now() > lastSlotToday.getTime()) {
      start.setDate(start.getDate() + 1)
    }
    const next7 = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      next7.push(d)
    }
    setDays(next7)
  }, [docId, navigate, doctors])

  // Load already-booked slots for this doctor so they can be disabled.
  // Skipped when logged out - the endpoint needs auth and a 401 would bounce
  // the visitor to /login via the axios interceptor.
  const loadBooked = useCallback(async () => {
    if (!docId || !sessionStorage.getItem('token')) return
    try {
      const res = await api.get(`/appointments/booked/${docId}`)
      setBookedSlots(res.data || [])
    } catch {
      // not logged in or request failed - slots simply won't be pre-disabled
      setBookedSlots([])
    }
  }, [docId])

  useEffect(() => { loadBooked() }, [loadBooked])

  // Build an ISO datetime for a given day + time slot
  const slotDateTime = (day, h, m) => {
    const d = new Date(day)
    d.setHours(h, m, 0, 0)
    return d
  }

  const isSlotBooked = (day, h, m) => {
    const iso = slotDateTime(day, h, m).toISOString()
    return bookedSlots.includes(iso)
  }

  const isSlotPast = (day, h, m) => slotDateTime(day, h, m).getTime() < Date.now()

  // The doctor has blocked this slot off on their schedule.
  const isSlotUnavailable = (day, h, m) =>
    isInUnavailable(doctor?.unavailability, slotDateTime(day, h, m))

  const handleBook = async () => {
    if (!user) {
      toast.info('Please log in to book an appointment')
      navigate('/login')
      return
    }
    if (selectedTime == null) {
      toast.warn('Please select a time slot')
      return
    }
    const day = days[selectedDayIdx]
    const when = slotDateTime(day, selectedTime.h, selectedTime.m)
    if (when.getTime() < Date.now()) {
      toast.warn('That slot is in the past, pick another')
      return
    }
    if (isInUnavailable(doctor.unavailability, when)) {
      toast.warn('The doctor is unavailable at that time, pick another slot')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/appointments', {
        doctorId: doctor._id,
        doctorName: doctor.name,
        speciality: doctor.speciality,
        fees: doctor.fees,
        doctorAddress: doctor.address,
        dateTime: when.toISOString(),
        notes: '',
        paid: false,
      })
      toast.success('Appointment booked')
      navigate('/my-appointments')
    } catch (err) {
      if (err.response?.status === 409) {
        const reason = err.response?.data?.error
        if (reason === 'doctor-unavailable') {
          toast.error('The doctor has marked this time as unavailable. Please pick another slot.')
        } else {
          toast.error('This slot is already booked. Please pick another time.')
          loadBooked()
        }
      } else if (err.response?.status === 401) {
        toast.info('Please log in to book an appointment')
        navigate('/login')
      } else {
        toast.error('Could not book appointment. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!doctor) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading doctor information...</p>
        </div>
      </div>
    )
  }

  const relatedDoctors = (doctors || [])
    .filter(d => d._id !== doctor._id && d.speciality === doctor.speciality)
    .slice(0, 5)
  const fallbackRelated = (doctors || []).filter(d => d._id !== doctor._id).slice(0, 5)
  const related = relatedDoctors.length ? relatedDoctors : fallbackRelated

  return (
    <div className='py-8'>
      {/* Doctor card */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='sm:w-44'>
          <img
            className='bg-primary w-full rounded-lg object-cover'
            src={doctor.image}
            alt={doctor.name}
          />
        </div>

        <div className='flex-1 border border-gray-200 rounded-lg p-6'>
          <p className='flex items-center gap-2 text-2xl font-semibold text-gray-800'>
            {doctor.name}
            <img className='w-5' src={assets.verified_icon} alt='Verified' />
          </p>

          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{doctor.degree} - {doctor.speciality}</p>
            <span className='py-0.5 px-2 border border-gray-300 text-xs rounded-full'>
              {doctor.experience}
            </span>
          </div>

          {/* Live availability indicator */}
          {isUnavailableNow(doctor.unavailability) ? (
            <span className='inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-red-500'>
              <span className='w-2 h-2 bg-red-500 rounded-full'></span>
              Unavailable
            </span>
          ) : (
            <span className='inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-green-500'>
              <span className='w-2 h-2 bg-green-500 rounded-full'></span>
              Available
            </span>
          )}

          <div className='mt-3'>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-800'>
              About <img className='w-3' src={assets.info_icon} alt='' />
            </p>
            <p className='text-sm text-gray-500 max-w-2xl mt-1'>{doctor.about}</p>
          </div>

          <p className='text-gray-600 font-medium mt-4'>
            Appointment fee: <span className='text-gray-800'>${doctor.fees}</span>
          </p>
        </div>
      </div>

      {/* Booking slots */}
      <div className='mt-8 sm:ml-48'>
        <p className='text-gray-700 font-medium'>Booking slots</p>

        {/* Day selector */}
        <div className='flex gap-3 items-center w-full overflow-x-auto mt-4'>
          {days.map((day, idx) => (
            <button
              key={idx}
              onClick={() => { setSelectedDayIdx(idx); setSelectedTime(null) }}
              className={`text-center py-4 min-w-16 rounded-full cursor-pointer transition-colors ${
                selectedDayIdx === idx
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 text-gray-700 hover:border-primary'
              }`}
            >
              <p className='text-xs'>{DAY_NAMES[day.getDay()]}</p>
              <p className='font-medium'>{day.getDate()}</p>
            </button>
          ))}
        </div>

        {/* Time selector */}
        <div className='flex flex-wrap gap-3 mt-5'>
          {days.length > 0 && TIME_SLOTS.map(({ h, m }) => {
            const day = days[selectedDayIdx]
            const booked = isSlotBooked(day, h, m)
            const past = isSlotPast(day, h, m)
            const unavailable = isSlotUnavailable(day, h, m)
            const disabled = booked || past || unavailable
            const selected = selectedTime?.h === h && selectedTime?.m === m
            return (
              <button
                key={`${h}:${m}`}
                disabled={disabled}
                onClick={() => setSelectedTime({ h, m })}
                title={
                  unavailable ? 'Doctor unavailable'
                  : booked ? 'Already booked'
                  : past ? 'Time has passed' : ''
                }
                className={`text-sm font-light px-4 py-2 rounded-full transition-colors ${
                  selected
                    ? 'bg-primary text-white'
                    : disabled
                    ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed'
                    : 'border border-gray-300 text-gray-500 hover:border-primary cursor-pointer'
                }`}
              >
                {formatSlotLabel(h, m)}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleBook}
          disabled={isLoading}
          className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full mt-6 disabled:opacity-50 hover:bg-primary/90 transition-colors'
        >
          {isLoading ? 'Booking...' : 'Book an appointment'}
        </button>
      </div>

      {/* Related doctors */}
      <div className='flex flex-col items-center gap-2 my-16 text-gray-800'>
        <h1 className='text-2xl font-semibold'>Related Doctors</h1>
        <p className='sm:w-1/3 text-center text-sm text-gray-600'>
          Simply browse through our extensive list of trusted doctors.
        </p>

        <div className='w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-5'>
          {related.map(d => (
            <div
              key={d._id}
              onClick={() => { navigate(`/appointment/${d._id}`); window.scrollTo(0, 0) }}
              className='border border-blue-100 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-transform duration-300'
            >
              <img className='bg-blue-50 w-full' src={d.image} alt={d.name} />
              <div className='p-4'>
                {isUnavailableNow(d.unavailability) ? (
                  <div className='flex items-center gap-2 text-sm text-red-500'>
                    <span className='w-2 h-2 bg-red-500 rounded-full'></span>
                    <span>Unavailable</span>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-sm text-green-500'>
                    <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                    <span>Available</span>
                  </div>
                )}
                <p className='text-gray-900 font-medium mt-1'>{d.name}</p>
                <p className='text-gray-600 text-sm'>{d.speciality}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Appointment
