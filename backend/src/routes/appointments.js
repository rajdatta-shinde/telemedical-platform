import { Router } from 'express'
import { nanoid } from 'nanoid'
import { requireAuth } from '../middleware/auth.js'
import { resolveDoctor } from '../lib/seedDoctors.js'
import { refundAppointmentPayment } from '../lib/refunds.js'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { Doctor } from '../models/Doctor.js'

export const appointmentsRouter = Router()

// helper: compute age in years from an ISO date-of-birth string
const ageFromDob = (dob) => {
  if (!dob) return ''
  const d = new Date(dob)
  if (isNaN(d)) return ''
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / 31557600000) // ms per average year
}

const stripDoc = (obj) => {
  const out = { ...obj }
  delete out._id
  delete out.__v
  return out
}

// All appointments, enriched with patient/doctor details for the admin table
appointmentsRouter.get('/', requireAuth(['admin']), async (req, res) => {
  const appts = await Appointment.find().lean()
  const emails = [...new Set(appts.map(a => a.patientEmail))]
  const doctorIds = [...new Set(appts.map(a => a.doctorId))]
  const [patients, doctors] = await Promise.all([
    User.find({ email: { $in: emails } }).lean(),
    Doctor.find({ id: { $in: doctorIds } }).lean(),
  ])
  const patientByEmail = new Map(patients.map(p => [p.email, p]))
  const doctorById = new Map(doctors.map(d => [d.id, d]))

  const enriched = appts.map(a => {
    const patient = patientByEmail.get(a.patientEmail) || {}
    const doctor = doctorById.get(a.doctorId) || {}
    return {
      ...stripDoc(a),
      patientName: patient.name || a.patientName || 'Unknown Patient',
      patientImage: patient.profileImage || '',
      patientAge: ageFromDob(patient.dateOfBirth),
      doctorImage: doctor.image || a.doctorImage || '',
      department: doctor.speciality || a.speciality || '',
      fees: doctor.fees ?? a.fees ?? 0,
      status: a.status || 'upcoming',
    }
  })
  res.json(enriched)
})

// Booked slots for a doctor (used by the booking page to disable taken times)
appointmentsRouter.get('/booked/:doctorId', requireAuth(['patient', 'doctor', 'admin']), async (req, res) => {
  const taken = await Appointment.find({
    doctorId: req.params.doctorId,
    status: { $ne: 'cancelled' },
  }).lean()
  res.json(taken.map(a => a.dateTime))
})

// Cancel (delete) an appointment - admin only. A paid appointment is refunded
// before it is removed so the money is never lost when the record disappears.
appointmentsRouter.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const appt = await Appointment.findOne({ id: req.params.id })
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })

  let refund = null
  if (appt.paid && !appt.refundStatus) {
    refund = await refundAppointmentPayment(appt.id, 'Appointment cancelled by admin')
  }

  await Appointment.deleteOne({ id: req.params.id })
  res.json({ ok: true, refundIssued: !!refund, refund })
})

// Update an appointment's status / payment
// - patient: may cancel or pay for their own appointment
// - doctor/admin: may set any status
appointmentsRouter.patch('/:id', requireAuth(['patient', 'doctor', 'admin']), async (req, res) => {
  const appt = await Appointment.findOne({ id: req.params.id })
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })

  const { id, role, email } = req.user
  if (role === 'patient' && appt.patientEmail !== email) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  // doctors may only touch appointments booked with them
  if (role === 'doctor' && appt.doctorId !== id && appt.doctorEmail !== email) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { status, paid } = req.body
  let refundIssued = false
  if (status !== undefined) {
    const allowed = ['upcoming', 'completed', 'cancelled']
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    // patients are only allowed to cancel
    if (role === 'patient' && status !== 'cancelled') {
      return res.status(403).json({ error: 'Patients can only cancel appointments' })
    }

    // Cancelling a paid appointment auto-refunds the consultation fee. We do
    // this before flipping the status so the patient never sees a cancelled,
    // paid appointment without a refund attached. Only the first cancellation
    // triggers a refund (refundAppointmentPayment no-ops once already refunded).
    const wasUpcoming = appt.status !== 'cancelled'
    if (status === 'cancelled' && wasUpcoming && appt.paid && !appt.refundStatus) {
      const who = role === 'patient' ? 'patient' : role
      const refund = await refundAppointmentPayment(
        appt.id,
        `Appointment cancelled by ${who}`,
      )
      if (refund) {
        appt.refundStatus = 'processing'
        appt.refundAmount = refund.refundAmount
        appt.refundId = refund.refundId
        appt.refundedAt = refund.refundedAt
        refundIssued = true
      }
    }

    appt.status = status
  }
  if (paid !== undefined) appt.paid = !!paid

  await appt.save()
  res.json({ ...appt.toObject(), refundIssued })
})

appointmentsRouter.get('/mine', requireAuth(['patient', 'doctor', 'admin']), async (req, res) => {
  const { id, role, email } = req.user
  if (role === 'patient') {
    const own = await Appointment.find({ patientEmail: email }).lean()
    return res.json(own.map(stripDoc))
  }
  if (role === 'doctor') {
    // doctors see only appointments booked with them — matched by account id
    // (appointments store the doctor's id) or by an explicit doctorEmail link
    const own = await Appointment.find({
      $or: [{ doctorId: id }, { doctorEmail: email }],
    }).lean()
    const emails = [...new Set(own.map(a => a.patientEmail))]
    const patients = await User.find({ email: { $in: emails } }).lean()
    const patientByEmail = new Map(patients.map(p => [p.email, p]))
    const enriched = own.map(a => {
      const patient = patientByEmail.get(a.patientEmail) || {}
      return {
        ...stripDoc(a),
        patientName: patient.name || a.patientName || 'Unknown Patient',
        patientImage: patient.profileImage || '',
        patientAge: ageFromDob(patient.dateOfBirth),
        status: a.status || 'upcoming',
      }
    })
    return res.json(enriched)
  }
  const all = await Appointment.find().lean()
  res.json(all.map(stripDoc))
})

appointmentsRouter.post('/', requireAuth(['patient', 'admin']), async (req, res) => {
  // Only doctorId / dateTime / notes are trusted from the client. Fees, name
  // and speciality are looked up server-side so a patient cannot tamper with
  // the price they will be charged. `paid` is never accepted here — payment
  // is recorded exclusively through the /payments routes.
  const { doctorId, doctorImage, dateTime, notes } = req.body
  if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' })
  if (!dateTime) return res.status(400).json({ error: 'Missing dateTime' })

  const when = new Date(dateTime)
  if (isNaN(when.getTime())) return res.status(400).json({ error: 'Invalid dateTime' })
  if (when.getTime() < Date.now()) {
    return res.status(400).json({ error: 'Cannot book an appointment in the past' })
  }

  const doctor = await resolveDoctor(doctorId)
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

  // unavailability guard: reject any slot that falls inside a window the
  // doctor has blocked off. Windows are [start, end) so a slot at exactly the
  // end boundary is still bookable.
  const blocked = (doctor.unavailability || []).some(u => {
    const s = new Date(u.start).getTime()
    const e = new Date(u.end).getTime()
    return when.getTime() >= s && when.getTime() < e
  })
  if (blocked) {
    return res.status(409).json({ error: 'doctor-unavailable' })
  }

  // double-booking guard: same doctor + same time, not cancelled
  const clash = await Appointment.findOne({
    doctorId,
    dateTime,
    status: { $ne: 'cancelled' },
  })
  if (clash) {
    return res.status(409).json({ error: 'already-booked' })
  }

  const patient = (await User.findOne({ email: req.user.email }).lean()) || {}

  const appt = await Appointment.create({
    id: nanoid(),
    doctorId,
    doctorEmail: doctor.email || null,
    doctorName: doctor.name,
    speciality: doctor.speciality,
    fees: doctor.fees,
    doctorImage: doctor.image || doctorImage || '',
    doctorAddress: doctor.address || null,
    patientEmail: req.user.email,
    patientName: patient.name || req.user.name || 'Patient',
    dateTime,
    notes: notes || '',
    status: 'upcoming',
    paid: false,
  })
  res.status(201).json(appt)
})
