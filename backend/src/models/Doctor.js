import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

const doctorSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  role: { type: String, default: 'doctor' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  speciality: { type: String, required: true },
  education: { type: String, default: '' },
  experience: { type: String, default: '' },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
  },
  fees: { type: Number, default: 0 },
  about: { type: String, default: '' },
  image: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  phone: { type: String, default: '' },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: String, default: null },
  isActive: { type: Boolean, default: true, index: true },
  deactivatedAt: { type: String, default: null },
  // Time windows the doctor has marked themselves unavailable for. Each entry
  // is an absolute ISO start/end pair (built from the doctor's local calendar
  // day + a time-of-day range). Patients can't book slots that fall inside any
  // window, and a window covering "now" surfaces an Unavailable badge.
  unavailability: {
    type: [{
      _id: false,
      id: { type: String, required: true },
      start: { type: String, required: true },
      end: { type: String, required: true },
    }],
    default: [],
  },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, {
  strict: true,
  toJSON: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
  toObject: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
})

export const Doctor = mongoose.model('Doctor', doctorSchema)
