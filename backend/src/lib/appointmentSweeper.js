import { Appointment } from '../models/Appointment.js'

// How long after its start time an appointment is considered finished. Once
// `dateTime + duration` is in the past, an still-`upcoming` appointment that
// nobody cancelled is automatically marked `completed`.
const DURATION_MIN = Number(process.env.APPOINTMENT_DURATION_MIN || 30)

// How often the background sweep runs.
const SWEEP_INTERVAL_MS = Number(process.env.APPOINTMENT_SWEEP_MS || 60_000)

// Mark every past, uncancelled, still-upcoming appointment as completed.
// `dateTime` is stored as an ISO string, so we fetch the upcoming ones and
// compare in JS rather than relying on a string/date `$lt` query.
export async function sweepCompletedAppointments(now = Date.now()) {
  const cutoffMs = DURATION_MIN * 60_000
  const upcoming = await Appointment.find({ status: 'upcoming' })
    .select('id dateTime')
    .lean()

  const dueIds = upcoming
    .filter(a => {
      const start = new Date(a.dateTime).getTime()
      if (Number.isNaN(start)) return false // skip unparseable dates
      return start + cutoffMs <= now
    })
    .map(a => a.id)

  if (dueIds.length === 0) return 0

  await Appointment.updateMany(
    { id: { $in: dueIds }, status: 'upcoming' },
    { $set: { status: 'completed' } },
  )
  return dueIds.length
}

// Run one sweep immediately, then on a fixed interval. Returns the timer so the
// caller can clear it (e.g. in tests). Failures are logged, never thrown, so a
// transient DB hiccup can't crash the server.
export function startAppointmentSweeper() {
  const run = async () => {
    try {
      const n = await sweepCompletedAppointments()
      if (n > 0) console.log(`Auto-completed ${n} past appointment(s)`)
    } catch (err) {
      console.error('Appointment sweep failed:', err.message)
    }
  }

  run()
  const timer = setInterval(run, SWEEP_INTERVAL_MS)
  timer.unref?.() // don't keep the process alive just for the sweep
  return timer
}
