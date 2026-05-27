import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../utils/axios'
import DoctorLayout from '../components/DoctorLayout'
import {
  START_OPTIONS,
  END_OPTIONS,
  minutesToLabel,
  buildIso,
} from '../utils/availability'

// 'YYYY-MM-DD' for today, in local time (for the date input's min + default).
const todayStr = () => {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

const formatDateLabel = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const formatTimeLabel = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

const DoctorSchedule = () => {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const [date, setDate] = useState(todayStr())
  const [startMin, setStartMin] = useState(START_OPTIONS[0])
  const [endMin, setEndMin] = useState(START_OPTIONS[0] + 180) // default 3h block

  const load = async () => {
    try {
      const res = await api.get('/doctors/me/unavailability')
      setBlocks(res.data || [])
    } catch {
      toast.error('Failed to load your schedule')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!date) {
      toast.warn('Please pick a date')
      return
    }
    if (endMin <= startMin) {
      toast.warn('End time must be after the start time')
      return
    }
    const start = buildIso(date, startMin)
    const end = buildIso(date, endMin)
    if (new Date(end).getTime() <= Date.now()) {
      toast.warn('That time window has already passed')
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/doctors/me/unavailability', { start, end })
      setBlocks(res.data || [])
      toast.success('Marked unavailable')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id) => {
    setRemovingId(id)
    try {
      const res = await api.delete(`/doctors/me/unavailability/${id}`)
      setBlocks(res.data || [])
      toast.success('Window removed — you are available again')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove window')
    } finally {
      setRemovingId(null)
    }
  }

  // Group windows by their local calendar day and sort chronologically so the
  // doctor can see, per day, every block they've added.
  const grouped = useMemo(() => {
    const byDay = new Map()
    const sorted = [...blocks].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    )
    for (const b of sorted) {
      const key = new Date(b.start).toDateString()
      if (!byDay.has(key)) byDay.set(key, [])
      byDay.get(key).push(b)
    }
    return [...byDay.entries()]
  }, [blocks])

  return (
    <DoctorLayout>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-700">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mark the times you are <span className="font-medium">not available</span>. Patients
          won&apos;t be able to book those slots, and you&apos;ll show as unavailable to patients and the admin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Add a window */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 h-fit">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Add unavailable slot</h2>
          <p className="text-xs text-gray-500 mb-5">
            Pick a date and a time range. Repeat to block more than one range on the same day
            (e.g. 9–12, then 3–6).
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
          />

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <select
                value={startMin}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setStartMin(v)
                  if (endMin <= v) setEndMin(v + 30)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {START_OPTIONS.map((m) => (
                  <option key={m} value={m}>{minutesToLabel(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                value={endMin}
                onChange={(e) => setEndMin(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {END_OPTIONS.filter((m) => m > startMin).map((m) => (
                  <option key={m} value={m}>{minutesToLabel(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full bg-primary text-white text-sm font-medium px-4 py-2.5 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Mark unavailable'}
          </button>
        </div>

        {/* Existing windows */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Unavailable slots</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-gray-500">
              You haven&apos;t marked any unavailable time. You&apos;re shown as available to everyone.
            </p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([day, items]) => (
                <div key={day}>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {formatDateLabel(items[0].start)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((b) => (
                      <span
                        key={b.id}
                        className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-full pl-4 pr-2 py-1.5"
                      >
                        {formatTimeLabel(b.start)} – {formatTimeLabel(b.end)}
                        <button
                          onClick={() => handleRemove(b.id)}
                          disabled={removingId === b.id}
                          title="Remove (become available again)"
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  )
}

export default DoctorSchedule
