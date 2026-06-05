import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense, useState } from 'react'
import { Bot } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import TeklifChatbot from './components/TeklifChatbot'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'

const Home = lazy(() => import('./pages/Home'))
const Hizmetler = lazy(() => import('./pages/Hizmetler'))
const Kurumsal = lazy(() => import('./pages/Kurumsal'))
const Referanslar = lazy(() => import('./pages/Referanslar'))
const Iletisim = lazy(() => import('./pages/Iletisim'))
const Projelerimiz = lazy(() => import('./pages/Projelerimiz'))
const ProjeDetay = lazy(() => import('./pages/projeler/ProjeDetay'))
const NedenBizDetay = lazy(() => import('./pages/neden-biz/NedenBizDetay'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogDetay = lazy(() => import('./pages/BlogDetay'))
const SSS = lazy(() => import('./pages/SSS'))
const NotFound = lazy(() => import('./pages/NotFound'))

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ProjelerAdmin = lazy(() => import('./pages/admin/ProjelerAdmin'))
const ProjeForm = lazy(() => import('./pages/admin/ProjeForm'))
const ReferanslarAdmin = lazy(() => import('./pages/admin/ReferanslarAdmin'))
const ReferansForm = lazy(() => import('./pages/admin/ReferansForm'))
const BlogAdmin = lazy(() => import('./pages/admin/BlogAdmin'))
const BlogForm = lazy(() => import('./pages/admin/BlogForm'))
const SSSAdmin = lazy(() => import('./pages/admin/SSSAdmin'))
const Analitik = lazy(() => import('./pages/admin/Analitik'))
const Guvenlik = lazy(() => import('./pages/admin/Guvenlik'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ProtectedRoute({ children }) {
  const { isAuth } = useAdminAuth()
  if (!isAuth) return <Navigate to="/admin/login" replace />
  return children
}

function PageLoader() {
  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" /></div>
}

function openChat(setChatOpen) {
  setChatOpen(true)
}

function PublicLayout() {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatClosing, setChatClosing] = useState(false)
  const [chatMessages, setChatMessages] = useState(null)

  function handleCloseChat() {
    setChatClosing(true)
    setTimeout(() => {
      setChatOpen(false)
      setChatClosing(false)
    }, 220)
  }

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
            <Route path="/neden-biz/:slug" element={<NedenBizDetay />} />
            <Route path="/referanslar" element={<Referanslar />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetay />} />
            <Route path="/sss" element={<SSS />} />
            <Route path="/iletisim" element={<Iletisim />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <button
        onClick={() => openChat(setChatOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg shadow-black/15 transition-all hover:scale-105"
      >
        <Bot size={18} />
        Size Nasıl Yardımcı Olabiliriz?
      </button>
      {chatOpen && (
        <TeklifChatbot
          onClose={handleCloseChat}
          closing={chatClosing}
          messages={chatMessages}
          onMessagesChange={setChatMessages}
        />
      )}
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
            <Route path="blog" element={<BlogAdmin />} />
            <Route path="blog/yeni" element={<BlogForm />} />
            <Route path="blog/:id/duzenle" element={<BlogForm />} />
            <Route path="sss" element={<SSSAdmin />} />
            <Route path="analitik" element={<Analitik />} />
            <Route path="guvenlik" element={<Guvenlik />} />
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
