import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

const paymentSchema = new mongoose.Schema({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  appointmentId: { type: String, required: true, index: true },
  patientEmail: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  // created -> paid -> refunded (or failed)
  status: { type: String, default: 'created' },
  method: { type: String, default: null },
  // which gateway processed this order (e.g. 'razorpay'); null for the mock flow
  gateway: { type: String, default: null },
  // Razorpay order id + signature, set when paid through the Razorpay checkout
  razorpayOrderId: { type: String, default: null, index: true },
  razorpaySignature: { type: String, default: null },
  paymentId: { type: String, default: null },
  txnId: { type: String, default: null },
  vpa: { type: String, default: null },
  cardLast4: { type: String, default: null },
  bank: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  paidAt: { type: String, default: null },
  failedAt: { type: String, default: null },
  // refund details, populated when a paid appointment is cancelled
  refundId: { type: String, default: null },
  refundAmount: { type: Number, default: null },
  refundReason: { type: String, default: null },
  refundedAt: { type: String, default: null },
}, {
  strict: true,
  toJSON: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
  toObject: { transform: (_, ret) => { delete ret._id; delete ret.__v; return ret } },
})

export const Payment = mongoose.model('Payment', paymentSchema)
