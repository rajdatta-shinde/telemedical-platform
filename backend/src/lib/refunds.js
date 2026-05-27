import { nanoid } from 'nanoid'
import { Payment } from '../models/Payment.js'

// Number of working days we tell the patient a refund takes to land back in
// their account. Surfaced in the UI as "within 5-7 working days".
export const REFUND_WORKING_DAYS = '5-7'

// Issue a refund for an appointment that was paid online and is now being
// cancelled. The mock gateway confirms the reversal instantly (status flips to
// `refunded`); the patient is told it settles in their bank in a few working
// days, which mirrors how real card/UPI refunds behave.
//
// Returns the refund summary, or null when there is nothing to refund (the
// appointment was never paid, or has already been refunded). Safe to call on
// any cancellation path - it no-ops when no paid order exists.
export async function refundAppointmentPayment(appointmentId, reason = 'Appointment cancelled') {
  const payment = await Payment.findOne({ appointmentId, status: 'paid' })
  if (!payment) return null

  payment.status = 'refunded'
  payment.refundId = `rfnd_${nanoid(16)}`
  payment.refundAmount = payment.amount
  payment.refundReason = reason
  payment.refundedAt = new Date().toISOString()
  await payment.save()

  return {
    refundId: payment.refundId,
    refundAmount: payment.refundAmount,
    refundedAt: payment.refundedAt,
  }
}
