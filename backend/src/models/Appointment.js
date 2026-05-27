import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

const appointmentSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  doctorId: { type: String, required: true, index: true },
  doctorEmail: { type: String, default: null },
  doctorName: { type: String, default: '' },
  speciality: { type: String, default: '' },
  fees: { type: Number, default: 0 },
  doctorImage: { type: String, default: '' },
  doctorAddress: { type: mongoose.Schema.Types.Mixed, default: null },
  patientEmail: { type: String, required: true, index: true },
  patientName: { type: String, default: '' },
  dateTime: { type: String, required: true },
  notes: { type: String, default: '' },
  status: { type: String, default: 'upcoming' },
  paid: { type: Boolean, default: false },
  // refund summary shown to the patient after a paid appointment is cancelled.
  // refundStatus: null | 'processing' (money is on its way back to the payer)
  refundStatus: { type: String, default: null },
  refundAmount: { type: Number, default: 0 },
  refundId: { type: String, default: null },
  refundedAt: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, {
  strict: true,
  toJSON: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
  toObject: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
})

export const Appointment = mongoose.model('Appointment', appointmentSchema)
