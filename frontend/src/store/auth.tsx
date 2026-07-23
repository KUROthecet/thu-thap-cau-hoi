import React, { createContext, useCallback, useContext, useState } from 'react'
import { authApi } from '../api/authApi'
import type { UserResponse } from '../lib/types'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<UserResponse>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function readStoredUser(): UserResponse | null {
  const raw = localStorage.getItem('user')
  return raw ? (JSON.parse(raw) as UserResponse) : null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(readStoredUser)

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    const { access_token, user: userData } = response.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
