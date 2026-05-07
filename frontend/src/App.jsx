import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppWidget from './components/WhatsAppWidget'
import Home from './pages/Home'
import Hizmetler from './pages/Hizmetler'
import Kurumsal from './pages/Kurumsal'
import Referanslar from './pages/Referanslar'
import Iletisim from './pages/Iletisim'
import Projelerimiz from './pages/Projelerimiz'
import ProjeDetay from './pages/projeler/ProjeDetay'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProjelerAdmin from './pages/admin/ProjelerAdmin'
import ProjeForm from './pages/admin/ProjeForm'
import ReferanslarAdmin from './pages/admin/ReferanslarAdmin'
import ReferansForm from './pages/admin/ReferansForm'
import Analitik from './pages/admin/Analitik'
import TwoFactorSetup from './pages/admin/TwoFactorSetup'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function ProtectedRoute({ children }) {
  const { token, logout } = useAdminAuth()
  if (!isTokenValid(token)) {
    if (token) logout()
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hizmetler" element={<Hizmetler />} />
          <Route path="/kurumsal" element={<Kurumsal />} />
          <Route path="/projelerimiz" element={<Projelerimiz />} />
          <Route path="/projelerimiz/:slug" element={<ProjeDetay />} />
          <Route path="/referanslar" element={<Referanslar />} />
          <Route path="/iletisim" element={<Iletisim />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppWidget />
    </>
  )
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="projeler" element={<ProjelerAdmin />} />
          <Route path="projeler/yeni" element={<ProjeForm />} />
          <Route path="projeler/:id/duzenle" element={<ProjeForm />} />
          <Route path="referanslar" element={<ReferanslarAdmin />} />
          <Route path="referanslar/yeni" element={<ReferansForm />} />
          <Route path="referanslar/:id/duzenle" element={<ReferansForm />} />
          <Route path="analitik" element={<Analitik />} />
          <Route path="2fa" element={<TwoFactorSetup />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
