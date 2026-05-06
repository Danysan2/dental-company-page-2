'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/apiFetch'

export interface AuthUser {
  id:     string
  email:  string
  nombre: string
  rol:    'doctora' | 'recepcionista'
}

interface AuthContextType {
  user:    AuthUser | null
  loading: boolean
  login:   (email: string, password: string) => Promise<void>
  logout:  () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ user: AuthUser }>('/api/auth/me')
      .then(data => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: AuthUser }>('/api/auth/login', { email, password })
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout', {}).catch(() => {})
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
