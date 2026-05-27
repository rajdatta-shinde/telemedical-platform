// Minimal in-memory rate limiter. Sufficient for this single-process API.
// For a multi-instance deployment, swap the Map for a shared store (Redis).

export function rateLimit({ windowMs = 60_000, max = 10, message } = {}) {
  // ip -> { count, resetAt }
  const hits = new Map()
  let lastSweep = Date.now()

  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || req.socket?.remoteAddress || 'unknown'

    // periodically drop expired entries so the Map cannot grow unbounded
    if (now - lastSweep > windowMs) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
      lastSweep = now
    }

    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }

    entry.count++

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      res.set('Retry-After', String(retryAfter))
      return res.status(429).json({
        error: message || 'Too many requests. Please try again later.',
      })
    }

    next()
  }
}
