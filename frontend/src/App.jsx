import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppWidget from './components/WhatsAppWidget'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'

const Home = lazy(() => import('./pages/Home'))
const Hizmetler = lazy(() => import('./pages/Hizmetler'))
const Kurumsal = lazy(() => import('./pages/Kurumsal'))
const Referanslar = lazy(() => import('./pages/Referanslar'))
const Iletisim = lazy(() => import('./pages/Iletisim'))
const Projelerimiz = lazy(() => import('./pages/Projelerimiz'))
const ProjeDetay = lazy(() => import('./pages/projeler/ProjeDetay'))

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ProjelerAdmin = lazy(() => import('./pages/admin/ProjelerAdmin'))
const ProjeForm = lazy(() => import('./pages/admin/ProjeForm'))
const ReferanslarAdmin = lazy(() => import('./pages/admin/ReferanslarAdmin'))
const ReferansForm = lazy(() => import('./pages/admin/ReferansForm'))
const Analitik = lazy(() => import('./pages/admin/Analitik'))
const TwoFactorSetup = lazy(() => import('./pages/admin/TwoFactorSetup'))

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

function PageLoader() {
  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" /></div>
}

function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hizmetler" element={<Hizmetler />} />
            <Route path="/kurumsal" element={<Kurumsal />} />
            <Route path="/projelerimiz" element={<Projelerimiz />} />
            <Route path="/projelerimiz/:slug" element={<ProjeDetay />} />
            <Route path="/referanslar" element={<Referanslar />} />
            <Route path="/iletisim" element={<Iletisim />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppWidget />
    </>
  )
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
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
