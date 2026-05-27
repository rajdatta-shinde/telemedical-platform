import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { signToken } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { User } from '../models/User.js'
import { Doctor } from '../models/Doctor.js'

export const authRouter = Router()

const MIN_PASSWORD_LENGTH = 6

// Reset tokens are normally delivered by email. This project has no mail
// service, so in development the token is returned in the response to keep the
// flow testable. In production it must never be exposed to the caller.
const isProd = process.env.NODE_ENV === 'production'

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000, max: 10,
  message: 'Too many login attempts. Please try again in a few minutes.',
})
const registerLimiter = rateLimit({ windowMs: 60 * 60_000, max: 20 })
const forgotLimiter = rateLimit({ windowMs: 60 * 60_000, max: 10 })
const resetLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20 })

// Doctors created via the admin panel live in the doctors collection; everyone
// else lives in users. Locate an account by email across both collections.
const locateByEmail = async (email) => {
  const user = await User.findOne({ email })
  if (user) return { doc: user, isDoctor: false }
  const doctor = await Doctor.findOne({ email })
  if (doctor) return { doc: doctor, isDoctor: true }
  return null
}

const locateByResetToken = async (token) => {
  const user = await User.findOne({ resetToken: token })
  if (user) return { doc: user, isDoctor: false }
  const doctor = await Doctor.findOne({ resetToken: token })
  if (doctor) return { doc: doctor, isDoctor: true }
  return null
}

authRouter.post('/register', registerLimiter, async (req, res) => {
  const { name, password } = req.body
  if (!req.body.email || !password) return res.status(400).json({ error: 'Missing fields' })
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  }
  const email = String(req.body.email).trim().toLowerCase()

  // email must be unique across both users and doctors so login stays unambiguous
  const [existingUser, existingDoctor] = await Promise.all([
    User.findOne({ email }),
    Doctor.findOne({ email }),
  ])
  if (existingUser || existingDoctor) return res.status(409).json({ error: 'Email already in use' })

  const hash = await bcrypt.hash(password, 10)

  // Self-registration is always a patient account.
  // Doctor accounts are created by an admin; admin accounts are seeded manually.
  const user = await User.create({
    id: nanoid(),
    name: name || 'User',
    email,
    password: hash,
    role: 'patient',
  })
  const token = signToken(user)
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})

authRouter.post('/login', loginLimiter, async (req, res) => {
  try {
    const { role } = req.body
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = req.body.password
    // Both fields are required. Guard before bcrypt.compare, which throws on a
    // missing/non-string password.
    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const regularUser = await User.findOne({ email })
    const doctorUser = regularUser ? null : await Doctor.findOne({ email })
    const user = regularUser || doctorUser
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    // doctors from the admin panel may not carry a role field
    const actualRole = user.role || (doctorUser ? 'doctor' : undefined)
    // enforce that the "Sign in as" selection matches the account's real role
    if (role && actualRole && role !== actualRole) {
      return res.status(403).json({ error: `This account is not registered as ${role}. Please select "${actualRole}".` })
    }
    const token = signToken({ id: user.id, email: user.email, role: actualRole })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: actualRole } })
  } catch (err) {
    console.error('Login failed:', err?.message || err)
    res.status(500).json({ error: 'Login failed. Please try again.' })
  }
})

authRouter.post('/forgot-password', forgotLimiter, async (req, res) => {
  if (!req.body.email) return res.status(400).json({ error: 'Email required' })
  const email = String(req.body.email).trim().toLowerCase()
  const loc = await locateByEmail(email)
  if (!loc) return res.json({ ok: true }) // don't reveal whether email exists
  const resetToken = nanoid(32)
  const resetTokenExpiry = new Date(Date.now() + 3600_000).toISOString() // 1 hour
  loc.doc.resetToken = resetToken
  loc.doc.resetTokenExpiry = resetTokenExpiry
  await loc.doc.save()
  // In production the token is emailed, not returned. In development it is
  // included so the reset flow can be exercised without a mail service.
  res.json(isProd ? { ok: true } : { ok: true, resetToken })
})

authRouter.post('/reset-password', resetLimiter, async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' })
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  }
  const loc = await locateByResetToken(token)
  if (!loc) return res.status(400).json({ error: 'Invalid or expired reset token' })
  const account = loc.doc
  if (!account.resetTokenExpiry || new Date(account.resetTokenExpiry) < new Date()) {
    return res.status(400).json({ error: 'Reset token has expired' })
  }
  account.password = await bcrypt.hash(password, 10)
  account.resetToken = null
  account.resetTokenExpiry = null
  await account.save()
  res.json({ ok: true })
})
