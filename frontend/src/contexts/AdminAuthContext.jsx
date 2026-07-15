import { createContext, useContext, useState, useEffect } from 'react'
import { API } from '../api/config.js'
import { logout as apiLogout } from '../api/admin'
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

  // API çağrısı burada: token'ın jti'si sunucuda blacklist'lenmeden çıkış olmasın.
  // Oturum zaten düşmüşse (401 yolları) çağrı sessizce başarısız olur, sorun değil.
  const logout = () => {
    const done = apiLogout().catch(() => {})
    setIsAuth(false)
    return done
  }

  if (checking) return null

  return (
    <AdminAuthContext.Provider value={{ saveToken, logout, isAuth }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
