import { Router } from 'express'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { requireAuth } from '../middleware/auth.js'
import { Doctor } from '../models/Doctor.js'
import { User } from '../models/User.js'

export const doctorsRouter = Router()

// strip sensitive fields before sending a doctor to the client.
// resetToken/resetTokenExpiry MUST be removed — this list is served on a
// public, unauthenticated endpoint, so leaking a token enables takeover.
const publicDoctor = (d) => {
  const obj = typeof d.toObject === 'function' ? d.toObject() : { ...d }
  delete obj.password
  delete obj.resetToken
  delete obj.resetTokenExpiry
  delete obj._id
  delete obj.__v
  return obj
}

// List all ACTIVE doctors (public listing + patient booking).
// Soft-deleted (isActive=false) doctors are excluded here so they disappear
// from the frontend listing and can't be booked, while their records and
// past appointments stay safely in the database.
doctorsRouter.get('/', async (req, res) => {
  const doctors = await Doctor.find({ isActive: { $ne: false } }).lean()
  res.json(doctors.map(publicDoctor))
})

// Admin-only listing that includes deactivated doctors as well, so the
// Remove Doctor page can show both active and inactive entries.
doctorsRouter.get('/admin/all', requireAuth(['admin']), async (req, res) => {
  const doctors = await Doctor.find().sort({ createdAt: -1 }).lean()
  res.json(doctors.map(publicDoctor))
})

// Add a new doctor (admin only) - also creates a login account for the doctor
doctorsRouter.post('/', requireAuth(['admin']), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      education,
      experience,
      address1,
      address2,
      fees,
      about,
      image,
    } = req.body

    if (!name || !email || !password || !speciality) {
      return res.status(400).json({ error: 'Name, email, password and speciality are required' })
    }

    const normEmail = String(email).trim().toLowerCase()

    // email must be unique across both doctors and users (so login stays unambiguous)
    const [existingDoctor, existingUser] = await Promise.all([
      Doctor.findOne({ email: normEmail }),
      User.findOne({ email: normEmail }),
    ])
    if (existingDoctor || existingUser) {
      return res.status(409).json({ error: 'Email already in use' })
    }

    const hash = await bcrypt.hash(password, 10)
    const doctor = await Doctor.create({
      id: nanoid(),
      role: 'doctor',
      name,
      email: normEmail,
      password: hash,
      speciality,
      education: education || '',
      experience: experience || '',
      address: { line1: address1 || '', line2: address2 || '' },
      fees: Number(fees) || 0,
      about: about || '',
      image: image || '',
    })

    res.status(201).json(publicDoctor(doctor))
  } catch (error) {
    console.error('Error adding doctor:', error)
    res.status(500).json({ error: 'Failed to add doctor' })
  }
})

// ---------------------------------------------------------------------------
// Doctor availability (unavailability windows)
// ---------------------------------------------------------------------------
// Defined BEFORE the `/:id/...` routes below so the literal "me" segment is
// matched here rather than being captured as a doctor id.

// Validate and normalise an incoming { start, end } window. Returns a
// { block } object on success or { error } with a message on failure.
const buildUnavailabilityBlock = ({ start, end }) => {
  if (!start || !end) return { error: 'start and end are required' }
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return { error: 'Invalid start or end time' }
  if (e.getTime() <= s.getTime()) return { error: 'End time must be after start time' }
  if (e.getTime() <= Date.now()) return { error: 'Cannot mark a time window that has already passed' }
  return {
    block: { id: nanoid(), start: s.toISOString(), end: e.toISOString() },
  }
}

// List the logged-in doctor's own unavailability windows.
doctorsRouter.get('/me/unavailability', requireAuth(['doctor']), async (req, res) => {
  const doctor = await Doctor.findOne({ id: req.user.id }).lean()
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })
  res.json(doctor.unavailability || [])
})

// Add an unavailability window for the logged-in doctor.
doctorsRouter.post('/me/unavailability', requireAuth(['doctor']), async (req, res) => {
  const { block, error } = buildUnavailabilityBlock(req.body)
  if (error) return res.status(400).json({ error })

  const doctor = await Doctor.findOne({ id: req.user.id })
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

  doctor.unavailability = [...(doctor.unavailability || []), block]
  await doctor.save()
  res.status(201).json(doctor.unavailability)
})

// Remove one of the logged-in doctor's unavailability windows.
doctorsRouter.delete('/me/unavailability/:slotId', requireAuth(['doctor']), async (req, res) => {
  const doctor = await Doctor.findOne({ id: req.user.id })
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' })

  const before = (doctor.unavailability || []).length
  doctor.unavailability = (doctor.unavailability || []).filter(u => u.id !== req.params.slotId)
  if (doctor.unavailability.length === before) {
    return res.status(404).json({ error: 'Unavailability window not found' })
  }
  await doctor.save()
  res.json(doctor.unavailability)
})

// Soft-delete a doctor: hide them from the public listing/booking but keep
// the doctor record and all their historical appointments in the database.
doctorsRouter.patch('/:id/deactivate', requireAuth(['admin']), async (req, res) => {
  const doctor = await Doctor.findOneAndUpdate(
    { id: req.params.id },
    { isActive: false, deactivatedAt: new Date().toISOString() },
    { new: true }
  )
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' })
  }
  res.json(publicDoctor(doctor))
})

// Reactivate a previously soft-deleted doctor.
doctorsRouter.patch('/:id/reactivate', requireAuth(['admin']), async (req, res) => {
  const doctor = await Doctor.findOneAndUpdate(
    { id: req.params.id },
    { isActive: true, deactivatedAt: null },
    { new: true }
  )
  if (!doctor) {
    return res.status(404).json({ error: 'Doctor not found' })
  }
  res.json(publicDoctor(doctor))
})

// Hard delete kept for completeness, but the admin UI uses soft delete only.
doctorsRouter.delete('/:id', requireAuth(['admin']), async (req, res) => {
  const result = await Doctor.deleteOne({ id: req.params.id })
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Doctor not found' })
  }
  res.json({ ok: true })
})
