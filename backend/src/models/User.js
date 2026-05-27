import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

const userSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  name: { type: String, default: 'User' },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, default: 'patient' },
  memberSince: { type: String, default: () => new Date().toISOString() },
  phone: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  gender: { type: String, default: '' },
  address: { type: String, default: '' },
  emergencyContact: { type: String, default: '' },
  emergencyPhone: { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  currentMedications: { type: String, default: '' },
  lastUpdated: { type: String, default: () => new Date().toISOString() },
  image: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, {
  strict: true,
  toJSON: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
  toObject: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
})

export const User = mongoose.model('User', userSchema)
