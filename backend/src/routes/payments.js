import { Router } from 'express'
import { nanoid } from 'nanoid'
import { requireAuth } from '../middleware/auth.js'
import { Appointment } from '../models/Appointment.js'
import { Payment } from '../models/Payment.js'
import {
  razorpayConfigured,
  razorpayKeyId,
  createRazorpayOrder,
  verifyRazorpaySignature,
} from '../lib/razorpay.js'

export const paymentsRouter = Router()

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

// Luhn checksum - used by every card network to catch mistyped card numbers
const luhnValid = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length < 12 || digits.length > 19) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

// A UPI VPA looks like  name@bank  e.g. rajdatta@okhdfcbank
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

// Server-side validation of whatever the checkout collected from the payer.
// Returns an error string, or null when the details are acceptable.
const validatePaymentDetails = (method, details = {}) => {
  if (method === 'upi') {
    // app-intent / QR collect flows are approved inside the payer's UPI app,
    // so there is no VPA to validate on our side
    if (details.mode === 'intent' || details.mode === 'qr') return null
    if (!UPI_RE.test(details.vpa || '')) return 'Invalid UPI ID. Use the format name@bank'
    return null
  }
  if (method === 'card') {
    if (!luhnValid(details.number)) return 'Invalid card number'
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(details.expiry || '').trim())
    if (!m) return 'Invalid expiry. Use MM/YY'
    const month = Number(m[1])
    const year = 2000 + Number(m[2])
    if (month < 1 || month > 12) return 'Invalid expiry month'
    const expiresEndOfMonth = new Date(year, month, 0, 23, 59, 59)
    if (expiresEndOfMonth.getTime() < Date.now()) return 'This card has expired'
    if (!/^\d{3,4}$/.test(String(details.cvv || ''))) return 'Invalid CVV'
    if (!String(details.name || '').trim()) return 'Cardholder name is required'
    return null
  }
  if (method === 'netbanking') {
    if (!String(details.bank || '').trim()) return 'Please select a bank'
    return null
  }
  return 'Unsupported payment method'
}

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------

// Create (or reuse) an order for an appointment's consultation fee.
paymentsRouter.post('/create-order', requireAuth(['patient', 'admin']), async (req, res) => {
  const { appointmentId } = req.body
  if (!appointmentId) return res.status(400).json({ error: 'appointmentId is required' })

  const appt = await Appointment.findOne({ id: appointmentId })
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })

  if (req.user.role === 'patient' && appt.patientEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (appt.paid) return res.status(409).json({ error: 'This appointment is already paid' })

  const amount = Number(appt.fees) || 0
  if (amount <= 0) return res.status(400).json({ error: 'This appointment has no payable fee' })

  // reuse a pending order for the same appointment instead of piling up records
  let order = await Payment.findOne({ appointmentId, status: 'created' })
  if (!order) {
    order = await Payment.create({
      id: nanoid(),
      orderId: `order_${nanoid(14)}`,
      appointmentId,
      patientEmail: appt.patientEmail,
      amount,
      currency: 'INR',
      status: 'created',
    })
  }

  res.json({
    orderId: order.orderId,
    amount: order.amount,
    currency: order.currency,
    appointmentId,
    doctorName: appt.doctorName,
    speciality: appt.speciality,
    dateTime: appt.dateTime,
  })
})

// Verify / process a payment against an order, then mark the appointment paid.
paymentsRouter.post('/verify', requireAuth(['patient', 'admin']), async (req, res) => {
  const { orderId, method, details } = req.body
  if (!orderId || !method) return res.status(400).json({ error: 'orderId and method are required' })

  const order = await Payment.findOne({ orderId })
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (req.user.role === 'patient' && order.patientEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (order.status === 'paid') return res.status(409).json({ error: 'This order is already paid' })

  const problem = validatePaymentDetails(method, details)
  if (problem) {
    order.status = 'failed'
    order.failedAt = new Date().toISOString()
    await order.save()
    return res.status(402).json({ error: problem })
  }

  // payment accepted - record the transaction
  order.status = 'paid'
  order.method = method
  order.paymentId = `pay_${nanoid(16)}`
  order.txnId = `T${Date.now()}${Math.floor(Math.random() * 1000)}`
  order.paidAt = new Date().toISOString()
  if (method === 'upi') order.vpa = details.vpa || (details.app ? `${details.app}@upi` : 'upi-collect')
  if (method === 'card') order.cardLast4 = String(details.number).replace(/\D/g, '').slice(-4)
  if (method === 'netbanking') order.bank = details.bank

  await order.save()

  // reflect the payment on the appointment so the rest of the app sees it
  await Appointment.updateOne({ id: order.appointmentId }, { $set: { paid: true } })

  res.json({
    status: 'paid',
    orderId: order.orderId,
    appointmentId: order.appointmentId,
    paymentId: order.paymentId,
    txnId: order.txnId,
    method: order.method,
    amount: order.amount,
    currency: order.currency,
    paidAt: order.paidAt,
  })
})

// ---------------------------------------------------------------------------
// Razorpay (real gateway) - added alongside the existing mock methods above.
// Flow: create an order here -> open Razorpay checkout in the browser ->
// verify the signature returned by Razorpay before marking the appointment paid.
// ---------------------------------------------------------------------------

// Create a Razorpay order for an appointment's consultation fee. Mirrors the
// reuse logic of /create-order: one pending Payment record per appointment.
paymentsRouter.post('/razorpay/order', requireAuth(['patient', 'admin']), async (req, res) => {
  if (!razorpayConfigured()) {
    return res.status(503).json({ error: 'Online card/UPI gateway is not available right now' })
  }

  const { appointmentId } = req.body
  if (!appointmentId) return res.status(400).json({ error: 'appointmentId is required' })

  const appt = await Appointment.findOne({ id: appointmentId })
  if (!appt) return res.status(404).json({ error: 'Appointment not found' })

  if (req.user.role === 'patient' && appt.patientEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (appt.paid) return res.status(409).json({ error: 'This appointment is already paid' })

  const amount = Number(appt.fees) || 0
  if (amount <= 0) return res.status(400).json({ error: 'This appointment has no payable fee' })

  // reuse a pending order for the same appointment instead of piling up records
  let order = await Payment.findOne({ appointmentId, status: 'created' })
  if (!order) {
    order = await Payment.create({
      id: nanoid(),
      orderId: `order_${nanoid(14)}`,
      appointmentId,
      patientEmail: appt.patientEmail,
      amount,
      currency: 'INR',
      status: 'created',
    })
  }

  let rzpOrder
  try {
    rzpOrder = await createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt: order.orderId,
      notes: { appointmentId, patientEmail: appt.patientEmail },
    })
  } catch (err) {
    console.error('Razorpay order creation failed:', err?.message || err)
    return res.status(502).json({ error: 'Could not start the payment. Please try again.' })
  }

  // remember the gateway order id so /razorpay/verify can match the callback
  order.razorpayOrderId = rzpOrder.id
  order.gateway = 'razorpay'
  await order.save()

  res.json({
    keyId: razorpayKeyId(),
    razorpayOrderId: rzpOrder.id,
    orderId: order.orderId,
    amount: order.amount, // major unit (rupees) for display
    amountInPaise: rzpOrder.amount,
    currency: order.currency,
    appointmentId,
    doctorName: appt.doctorName,
    speciality: appt.speciality,
    dateTime: appt.dateTime,
  })
})

// Verify the Razorpay checkout response and mark the appointment paid.
paymentsRouter.post('/razorpay/verify', requireAuth(['patient', 'admin']), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing Razorpay payment confirmation fields' })
  }

  const order = await Payment.findOne({ razorpayOrderId: razorpay_order_id })
  if (!order) return res.status(404).json({ error: 'Order not found' })

  if (req.user.role === 'patient' && order.patientEmail !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (order.status === 'paid') return res.status(409).json({ error: 'This order is already paid' })

  const valid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  })
  if (!valid) {
    order.status = 'failed'
    order.failedAt = new Date().toISOString()
    await order.save()
    return res.status(400).json({ error: 'Payment verification failed' })
  }

  // signature checks out - record the transaction
  order.status = 'paid'
  order.method = 'razorpay'
  order.gateway = 'razorpay'
  order.paymentId = razorpay_payment_id
  order.txnId = razorpay_payment_id
  order.razorpaySignature = razorpay_signature
  order.paidAt = new Date().toISOString()
  await order.save()

  await Appointment.updateOne({ id: order.appointmentId }, { $set: { paid: true } })

  res.json({
    status: 'paid',
    orderId: order.orderId,
    appointmentId: order.appointmentId,
    paymentId: order.paymentId,
    txnId: order.txnId,
    method: order.method,
    amount: order.amount,
    currency: order.currency,
    paidAt: order.paidAt,
  })
})

// Payment history for the logged-in patient (admins see everything).
paymentsRouter.get('/mine', requireAuth(['patient', 'admin']), async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { patientEmail: req.user.email }
  const list = await Payment.find(filter).sort({ createdAt: -1 }).lean()
  res.json(list.map(p => {
    const { _id, __v, ...rest } = p
    return rest
  }))
})
