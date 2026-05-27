import crypto from 'node:crypto'
import Razorpay from 'razorpay'

// Razorpay credentials live in the backend .env:
//   RAZORPAY_KEY_ID      - public key id (also handed to the browser checkout)
//   RAZORPAY_KEY_SECRET  - secret key, used to create orders and verify signatures
const KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''

// True only when both keys are present, so routes can fail clearly instead of
// throwing deep inside the SDK when the platform owner hasn't configured them.
export const razorpayConfigured = () => Boolean(KEY_ID && KEY_SECRET)

// The public key id the browser needs to open the Razorpay checkout.
export const razorpayKeyId = () => KEY_ID

let client = null
const getClient = () => {
  if (!razorpayConfigured()) throw new Error('Razorpay is not configured')
  if (!client) client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  return client
}

// Create a Razorpay order. amount is in the major unit (e.g. rupees) and is
// converted to the smallest unit (paise) which the API expects.
export const createRazorpayOrder = ({ amount, currency = 'INR', receipt, notes }) =>
  getClient().orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt,
    notes,
  })

// Verify the signature Razorpay returns to the browser after a successful
// payment. Recomputes HMAC-SHA256(order_id|payment_id) with the secret and
// compares it to the signature in a timing-safe way.
export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!razorpayConfigured() || !orderId || !paymentId || !signature) return false
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
