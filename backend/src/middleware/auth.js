import jwt from 'jsonwebtoken'

// JWT signing secret. Validated once at startup (see assertJwtSecret) so the
// app never silently falls back to a guessable default.
const JWT_SECRET = process.env.JWT_SECRET

// Called from index.js before the server starts listening.
export function assertJwtSecret() {
  const insecure = ['', undefined, 'dev_secret', 'secret', 'changeme']
  if (insecure.includes(JWT_SECRET) || JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET is missing, too short, or set to an insecure default. ' +
      'Set a long random value in backend/.env (e.g. `openssl rand -hex 48`).'
    )
  }
}

export function requireAuth(roles = []) {
  return (req, res, next) => {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' })
      }
      req.user = payload
      next()
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}