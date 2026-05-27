import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Doctor } from '../models/Doctor.js'
import { Appointment } from '../models/Appointment.js'

export const adminRouter = Router()

// Get dashboard statistics
adminRouter.get('/stats', requireAuth(['admin']), async (req, res) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      // only upcoming appointments are counted (exclude completed & cancelled)
      Appointment.countDocuments({ status: 'upcoming' }),
    ])
    res.json({ totalDoctors, totalPatients, totalAppointments })
  } catch (error) {
    console.error('Error getting admin stats:', error)
    res.status(500).json({ message: 'Failed to get admin statistics' })
  }
})

// Get latest appointments (for the dashboard "Latest Appointment" panel)
adminRouter.get('/latest-appointments', requireAuth(['admin']), async (req, res) => {
  try {
    const latest = await Appointment.find()
      .sort({ dateTime: -1 })
      .limit(5)
      .lean()

    const doctorIds = [...new Set(latest.map(a => a.doctorId))]
    const doctors = await Doctor.find({ id: { $in: doctorIds } }).lean()
    const doctorById = new Map(doctors.map(d => [d.id, d]))

    const latestAppointments = latest.map(apt => {
      const doctor = doctorById.get(apt.doctorId) || {}
      return {
        id: apt.id,
        dateTime: apt.dateTime,
        doctorName: apt.doctorName || doctor.name || 'Unknown Doctor',
        doctorImage: doctor.image || '',
        patientName: apt.patientName || 'Unknown Patient',
      }
    })

    res.json(latestAppointments)
  } catch (error) {
    console.error('Error getting latest appointments:', error)
    res.status(500).json({ message: 'Failed to get latest appointments' })
  }
})
