import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/client.js'

const AuthContext = createContext(null)

/** Provides auth state (user, login, register, logout) to the component tree. */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from localStorage on first mount
  useEffect(() => {
    const token  = localStorage.getItem('waitless_token')
    const stored = localStorage.getItem('waitless_user')
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore bad JSON */ }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async ({ identifier, password }) => {
    const res = await authAPI.login({ identifier, password })
    localStorage.setItem('waitless_token', res.data.token)
    localStorage.setItem('waitless_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    localStorage.setItem('waitless_token', res.data.token)
    localStorage.setItem('waitless_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('waitless_token')
    localStorage.removeItem('waitless_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export default AuthContext
