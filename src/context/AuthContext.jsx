import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On app start — restore session from stored token
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authAPI.me()
      setUser(data.user)
    } catch {
      // Token invalid/expired — clear and let refresh interceptor handle it
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    // Save tokens FIRST, then set user — so any subsequent API calls have token
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    setUser(data.user)
    return data
  }

  const register = async (formData) => {
    const { data } = await authAPI.register(formData)
    // Save tokens FIRST, then set user
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
