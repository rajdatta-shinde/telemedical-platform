import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // Use sessionStorage (per-window) instead of localStorage (shared across all
  // tabs/windows of the same origin). This lets each window hold its own login
  // — e.g. a patient in one window and a doctor in another — without them
  // clobbering the shared `token`/`auth:user` keys.
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem('auth:user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('auth:user', JSON.stringify(user))
    } else {
      sessionStorage.removeItem('auth:user')
    }
  }, [user])

  const login = (payload) => {
    // payload: { token, user: { role, name, email, id } }
    if (payload.token) {
      sessionStorage.setItem('token', payload.token)
    }
    setUser({
      ...payload.user,
      role: payload.user.role,
      name: payload.user.name || 'User',
      email: payload.user.email || '',
    })
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    setUser(null)
  }

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, logout }), [user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


