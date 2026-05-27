import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { join } from 'node:path'
import { connectDb } from './lib/db.js'
import { sanitizeMongo } from './middleware/sanitize.js'
import { startAppointmentSweeper } from './lib/appointmentSweeper.js'
import { authRouter } from './routes/auth.js'
import { doctorsRouter } from './routes/doctors.js'
import { appointmentsRouter } from './routes/appointments.js'
import { paymentsRouter } from './routes/payments.js'
import { profileRouter } from './routes/profile.js'
import { adminRouter } from './routes/admin.js'
import { uploadRouter } from './routes/upload.js'
import { assertJwtSecret } from './middleware/auth.js'

// Fail fast if the JWT secret is missing or insecure — never start otherwise.
assertJwtSecret()

const app = express()

// Baseline security headers (HSTS, no-sniff, frameguard, etc.).
app.use(helmet())

// Restrict CORS to the known frontend origins instead of allowing every site.
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
app.use(cors({
  origin(origin, callback) {
    // allow non-browser clients (curl, server-to-server) which send no Origin
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '10mb' }))

// Strip MongoDB operators ($-prefixed / dotted keys) from all incoming data
// so request bodies can't inject operators into Mongoose queries.
app.use(sanitizeMongo)

// init db
await connectDb()

// Auto-complete past appointments that nobody cancelled.
startAppointmentSweeper()

app.get('/health', (req, res) => res.json({ ok: true }))
app.use('/auth', authRouter)
app.use('/doctors', doctorsRouter)
app.use('/appointments', appointmentsRouter)
app.use('/payments', paymentsRouter)
app.use('/profile', profileRouter)
app.use('/admin', adminRouter)
app.use('/upload', uploadRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))

app.get('/', (req, res) => res.json({ ok: true, service: 'telemedical-api' }))

// Centralised error handler. Catches multer upload errors, CORS rejections and
// anything passed to next(err), returning a generic JSON message so internal
// details and stack traces are never sent to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err?.message || err)
  if (res.headersSent) return
  const status = err?.status || err?.http_code || (err?.message === 'Not allowed by CORS' ? 403 : 500)
  res.status(status).json({ error: status === 403 ? 'Forbidden' : 'Something went wrong' })
})


