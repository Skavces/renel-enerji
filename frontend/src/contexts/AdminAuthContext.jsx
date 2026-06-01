import { createContext, useContext, useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''
const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then((r) => { if (r.ok) setIsAuth(true) })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const saveToken = () => setIsAuth(true)

  const logout = () => {
    setIsAuth(false)
    localStorage.removeItem('admin_token')
  }

  if (checking) return null

  return (
    <AdminAuthContext.Provider value={{ saveToken, logout, isAuth }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
