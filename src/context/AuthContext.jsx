import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authAPI.me()
      setUser(data.user)
    } catch {
      localStorage.clear()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data
  }

  const register = async (formData) => {
    const { data } = await authAPI.register(formData)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try { await authAPI.logout() } catch {}
    localStorage.clear()
    setUser(null)
  }

  const updateUser = (updated) => setUser(prev => ({ ...prev, ...updated }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
