import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Doctor } from '../models/Doctor.js'
import { Appointment } from '../models/Appointment.js'

export const profileRouter = Router()

// Doctors added through the admin panel live in the doctors collection,
// regular users (patients, admins, seeded doctors) live in users.
const locateUser = async (id) => {
  const user = await User.findOne({ id })
  if (user) return { doc: user, isDoctor: false }
  const doctor = await Doctor.findOne({ id })
  if (doctor) return { doc: doctor, isDoctor: true }
  return null
}

// Appointment statistics for either a patient or a doctor account
const buildStats = async (user) => {
  const filter = user.role === 'doctor'
    ? { $or: [{ doctorId: user.id }, { doctorEmail: user.email }] }
    : { $or: [{ patientId: user.id }, { patientEmail: user.email }] }
  const appts = await Appointment.find(filter).lean()
  const sorted = [...appts].sort((a, b) => new Date(b.dateTime || 0) - new Date(a.dateTime || 0))
  return {
    totalAppointments: appts.length,
    lastVisit: sorted[0]?.dateTime || null,
    upcomingAppointments: appts.filter(a => (a.status || 'upcoming') === 'upcoming').length,
    completedAppointments: appts.filter(a => a.status === 'completed').length,
  }
}

const sanitize = (doc) => {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc }
  delete obj.password
  delete obj.resetToken
  delete obj.resetTokenExpiry
  delete obj._id
  delete obj.__v
  return obj
}

// Get user profile
profileRouter.get('/', requireAuth(), async (req, res) => {
  try {
    const loc = await locateUser(req.user.id)
    if (!loc) {
      return res.status(404).json({ message: 'User not found' })
    }
    const user = loc.doc

    // Add memberSince if it doesn't exist
    if (!user.memberSince) {
      user.memberSince = user.createdAt || new Date().toISOString()
      await user.save()
    }

    const profile = sanitize(user)
    const role = user.role || (loc.isDoctor ? 'doctor' : 'patient')
    const stats = await buildStats({ id: user.id, email: user.email, role })
    res.json({ ...profile, role, stats })
  } catch (error) {
    console.error('Error getting profile:', error)
    res.status(500).json({ message: 'Failed to get profile' })
  }
})

// Update user profile
profileRouter.put('/', requireAuth(), async (req, res) => {
  try {
    const loc = await locateUser(req.user.id)
    if (!loc) {
      return res.status(404).json({ message: 'User not found' })
    }

    const currentUser = loc.doc
    const updateData = { ...req.body }

    // Don't allow updating sensitive fields
    delete updateData.password
    delete updateData.role
    delete updateData.id
    delete updateData.memberSince // Protect the original registration date
    delete updateData.stats

    // Doctors may only change their consultation fee, phone number and photo.
    // Identity fields (name, speciality, etc.) are managed by the admin so the
    // doctor stays discoverable in the admin panel and patient listings.
    if (req.user.role === 'doctor') {
      const doctorEditable = ['fees', 'phone', 'image', 'profileImage']
      Object.keys(updateData).forEach(key => {
        if (!doctorEditable.includes(key)) delete updateData[key]
      })
      if (updateData.fees !== undefined) updateData.fees = Number(updateData.fees) || 0
    } else {
      // Patients may only edit their own profile fields. email is excluded so
      // a patient cannot collide with another account or break login lookup;
      // arbitrary/unknown keys are dropped to prevent field injection.
      const patientEditable = [
        'name', 'phone', 'dateOfBirth', 'gender', 'address',
        'emergencyContact', 'emergencyPhone', 'medicalHistory',
        'currentMedications', 'image', 'profileImage',
      ]
      Object.keys(updateData).forEach(key => {
        if (!patientEditable.includes(key)) delete updateData[key]
      })
    }

    // Add last updated timestamp
    updateData.lastUpdated = new Date().toISOString()

    Object.entries(updateData).forEach(([key, value]) => {
      currentUser.set(key, value)
    })
    await currentUser.save()

    res.json(sanitize(currentUser))
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// Migration route to update existing users with proper fields
profileRouter.post('/migrate', requireAuth(['admin']), async (req, res) => {
  try {
    const users = await User.find({ memberSince: { $in: [null, '', undefined] } })
    let updated = 0
    for (const user of users) {
      user.memberSince = user.createdAt || new Date().toISOString()
      user.lastUpdated = new Date().toISOString()
      user.phone = user.phone || ''
      user.dateOfBirth = user.dateOfBirth || ''
      user.gender = user.gender || ''
      user.address = user.address || ''
      user.emergencyContact = user.emergencyContact || ''
      user.emergencyPhone = user.emergencyPhone || ''
      user.medicalHistory = user.medicalHistory || ''
      user.currentMedications = user.currentMedications || ''
      await user.save()
      updated++
    }
    res.json({ message: `Updated ${updated} users` })
  } catch (error) {
    console.error('Error migrating users:', error)
    res.status(500).json({ message: 'Failed to migrate users' })
  }
})
