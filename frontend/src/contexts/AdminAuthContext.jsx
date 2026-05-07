import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'))

  const saveToken = (t) => {
    localStorage.setItem('admin_token', t)
    setToken(t)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  return (
    <AdminAuthContext.Provider value={{ token, saveToken, logout, isAuth: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
