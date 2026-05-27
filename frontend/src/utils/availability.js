// Shared helpers for doctor "unavailability" windows.
//
// A window is { id, start, end } where start/end are absolute ISO datetime
// strings. They are built on the doctor's Schedule page from a calendar day +
// a time-of-day range using the browser's local time, exactly the way the
// booking page builds its slot datetimes, so the two line up.

// Minutes-of-day boundaries for the clinic's working hours (09:00 – 17:30).
export const DAY_START_MIN = 9 * 60   // 09:00
export const DAY_END_MIN = 17 * 60 + 30 // 17:30 (last bookable slot)
export const SLOT_STEP_MIN = 30

// Format minutes-of-day as a 12-hour label, e.g. 540 -> "9:00 am".
export const minutesToLabel = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Selectable start times: 09:00 … 17:30.
export const START_OPTIONS = (() => {
  const out = []
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += SLOT_STEP_MIN) out.push(m)
  return out
})()

// Selectable end times: 09:30 … 18:00. The extra half hour past the last slot
// lets a doctor block the 17:30 slot itself (end is exclusive).
export const END_OPTIONS = (() => {
  const out = []
  for (let m = DAY_START_MIN + SLOT_STEP_MIN; m <= DAY_END_MIN + SLOT_STEP_MIN; m += SLOT_STEP_MIN) out.push(m)
  return out
})()

// Build an ISO datetime from a 'YYYY-MM-DD' date string + minutes-of-day,
// interpreted in local time (matching the booking page's slot construction).
export const buildIso = (dateStr, mins) => {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, mo - 1, d, Math.floor(mins / 60), mins % 60, 0, 0)
  return dt.toISOString()
}

// Is the given instant (Date | ISO string | epoch ms) inside any window?
// Windows are treated as [start, end): the end boundary is available again.
export const isInUnavailable = (unavailability, when) => {
  if (!Array.isArray(unavailability) || unavailability.length === 0) return false
  const t = new Date(when).getTime()
  if (isNaN(t)) return false
  return unavailability.some((u) => {
    const s = new Date(u.start).getTime()
    const e = new Date(u.end).getTime()
    return !isNaN(s) && !isNaN(e) && t >= s && t < e
  })
}

// Is the doctor blocked off at this very moment?
export const isUnavailableNow = (unavailability) =>
  isInUnavailable(unavailability, Date.now())
