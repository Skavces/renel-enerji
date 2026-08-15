import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense, useState, useRef } from 'react'
import { Bot, Zap } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import TeklifChatbot from './components/TeklifChatbot'
import TeklifModal from './components/TeklifModal'
import PageLoader from './components/PageLoader'
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext'

const Home = lazy(() => import('./pages/Home'))
const Hizmetler = lazy(() => import('./pages/Hizmetler'))
const HizmetDetay = lazy(() => import('./pages/hizmetler/HizmetDetay'))
const Kurumsal = lazy(() => import('./pages/Kurumsal'))
const Referanslar = lazy(() => import('./pages/Referanslar'))
const Iletisim = lazy(() => import('./pages/Iletisim'))
const Projelerimiz = lazy(() => import('./pages/Projelerimiz'))
const ProjeDetay = lazy(() => import('./pages/projeler/ProjeDetay'))
const NedenBizDetay = lazy(() => import('./pages/neden-biz/NedenBizDetay'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogDetay = lazy(() => import('./pages/BlogDetay'))
const SSS = lazy(() => import('./pages/SSS'))
const Kvkk = lazy(() => import('./pages/Kvkk'))
const TasarrufHesaplayici = lazy(() => import('./pages/TasarrufHesaplayici'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminGateway = lazy(() => import('./pages/admin/AdminGateway'))

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
const ChatDegerlendirme = lazy(() => import('./pages/admin/ChatDegerlendirme'))
const TeklifTalepleri = lazy(() => import('./pages/admin/TeklifTalepleri'))
const Loglar = lazy(() => import('./pages/admin/Loglar'))
const Analitik = lazy(() => import('./pages/admin/Analitik'))
const Guvenlik = lazy(() => import('./pages/admin/Guvenlik'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function ProtectedRoute({ children }) {
  const { isAuth } = useAdminAuth()
  if (!isAuth) return <Navigate to="/rnl-panel/login" replace />
  return children
}

const OVERLAY_SHOW_DELAY_MS = 120
const OVERLAY_MIN_MS = 250
const OVERLAY_MAX_MS = 6000

// React Router, hedef sayfanın lazy chunk'ı inene kadar pathname'i perde
// arkasında bekletiyor (startTransition) — yani pathname değişimini izlemek
// chunk büyük/yavaşsa animasyonu saniyelerce geç tetikliyor. Bunun yerine
// tıklamanın kendisini dinleyip animasyonu anında gösteriyoruz; pathname
// gerçekten değiştiğinde (= hedef sayfa hazır) kapatıyoruz.
//
// Chunk zaten indirilmişse (aynı sayfaya ikinci ziyaret) geçiş birkaç ms
// içinde bitiyor — overlay'i o zaman göstermek gereksiz bir flaş yaratır.
// Bu yüzden overlay tıklamada değil, OVERLAY_SHOW_DELAY_MS sonra gösteriliyor;
// geçiş bu süre içinde zaten bitmişse gösterme hiç tetiklenmiyor. Gerçekten
// gösterildiyse flaş görünmemesi için en az OVERLAY_MIN_MS ekranda kalıyor.
// pathname hiç değişmezse (harici link, aynı sayfa vs.) OVERLAY_MAX_MS
// sonunda güvenlik amaçlı kapanıyor.
function usePageTransitionOverlay(pathname) {
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef(0)
  const isShowingRef = useRef(false)
  const showTimerRef = useRef(null)
  const hideTimerRef = useRef(null)
  const maxTimerRef = useRef(null)
  // window.location.pathname, history.pushState ile TIKLAMA ANINDA değişiyor
  // (React'ın kendi pathname state'i transition yüzünden geç günceller) —
  // "hedef zaten aynı sayfa mı" kontrolünü window.location yerine React'ın
  // henüz commit ettiği son pathname'e göre yapmak için bu ref kullanılıyor.
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    function handleClick(e) {
      const anchor = e.target.closest('a')
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      let url
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === pathnameRef.current) return

      clearTimeout(showTimerRef.current)
      clearTimeout(hideTimerRef.current)
      clearTimeout(maxTimerRef.current)
      isShowingRef.current = false
      showTimerRef.current = setTimeout(() => {
        isShowingRef.current = true
        shownAtRef.current = performance.now()
        setVisible(true)
      }, OVERLAY_SHOW_DELAY_MS)
      maxTimerRef.current = setTimeout(() => setVisible(false), OVERLAY_SHOW_DELAY_MS + OVERLAY_MAX_MS)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const isFirst = useRef(true)
  useEffect(() => {
    pathnameRef.current = pathname
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    clearTimeout(maxTimerRef.current)
    clearTimeout(showTimerRef.current)
    if (!isShowingRef.current) return
    const remaining = OVERLAY_MIN_MS - (performance.now() - shownAtRef.current)
    if (remaining > 0) {
      hideTimerRef.current = setTimeout(() => {
        isShowingRef.current = false
        setVisible(false)
      }, remaining)
    } else {
      isShowingRef.current = false
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false)
    }
  }, [pathname])

  useEffect(() => () => {
    clearTimeout(showTimerRef.current)
    clearTimeout(hideTimerRef.current)
    clearTimeout(maxTimerRef.current)
  }, [])

  return visible
}

function openChat(setChatOpen, setChatPrefill) {
  setChatPrefill('')
  setChatOpen(true)
}

function PublicLayout() {
  const location = useLocation()
  const showRouteOverlay = usePageTransitionOverlay(location.pathname)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatClosing, setChatClosing] = useState(false)
  const [chatMessages, setChatMessages] = useState(null)
  const [chatPrefill, setChatPrefill] = useState('')
  // Konuşma başına lead takibi için kimlik; sayfa yenilenene kadar sabit (mesajlar gibi)
  const [chatSessionId] = useState(() => crypto.randomUUID())

  const [teklifOpen, setTeklifOpen] = useState(false)
  const [teklifClosing, setTeklifClosing] = useState(false)

  function handleCloseChat() {
    setChatClosing(true)
    setTimeout(() => {
      setChatOpen(false)
      setChatClosing(false)
    }, 220)
  }

  function handleCloseTeklif() {
    setTeklifClosing(true)
    setTimeout(() => {
      setTeklifOpen(false)
      setTeklifClosing(false)
    }, 220)
  }

  // Sayfa içi CTA'lar (örn. tasarruf hesaplayıcı) chatbot'u bu event ile açar
  useEffect(() => {
    const open = e => {
      setChatPrefill(e.detail?.prefill || '')
      setChatOpen(true)
    }
    window.addEventListener('open-chat', open)
    return () => window.removeEventListener('open-chat', open)
  }, [])

  // Sayfa içi CTA'lar (örn. hizmet detay sayfaları) teklif modalını bu event ile açar
  useEffect(() => {
    const open = () => setTeklifOpen(true)
    window.addEventListener('open-teklif', open)
    return () => window.removeEventListener('open-teklif', open)
  }, [])

  return (
    <>
      <ScrollToTop />
      <PageLoader label="" fullScreen overlay show={showRouteOverlay} />
      <Navbar />
      <main>
        <Suspense fallback={<PageLoader fullScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hizmetler" element={<Hizmetler />} />
            <Route path="/hizmetler/:slug" element={<HizmetDetay />} />
            <Route path="/kurumsal" element={<Kurumsal />} />
            <Route path="/projelerimiz" element={<Projelerimiz />} />
            <Route path="/projelerimiz/:slug" element={<ProjeDetay />} />
            <Route path="/neden-biz/:slug" element={<NedenBizDetay />} />
            <Route path="/referanslar" element={<Referanslar />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetay />} />
            <Route path="/sss" element={<SSS />} />
            <Route path="/kvkk" element={<Kvkk />} />
            <Route path="/tasarruf-hesaplayici" element={<TasarrufHesaplayici />} />
            <Route path="/iletisim" element={<Iletisim />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <button
        onClick={() => setTeklifOpen(true)}
        className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg shadow-black/15 transition-all hover:scale-105"
      >
        <Zap size={18} />
        Ücretsiz Teklif Al
      </button>
      <div className="ai-button-ring fixed bottom-6 right-6 z-50 rounded-full p-0.5">
        <button
          onClick={() => openChat(setChatOpen, setChatPrefill)}
          className="flex items-center gap-2.5 bg-[#357228] hover:bg-[#2d6124] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg shadow-black/15 transition-all hover:scale-105"
        >
          <Bot size={18} />
          Size Nasıl Yardımcı Olabiliriz?
        </button>
      </div>
      {chatOpen && (
        <TeklifChatbot
          onClose={handleCloseChat}
          closing={chatClosing}
          messages={chatMessages}
          onMessagesChange={setChatMessages}
          sessionId={chatSessionId}
          prefill={chatPrefill}
        />
      )}
      {teklifOpen && <TeklifModal closing={teklifClosing} onClose={handleCloseTeklif} />}
    </>
  )
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<PageLoader fullScreen />}>
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
            <Route path="degerlendirmeler" element={<ChatDegerlendirme />} />
            <Route path="teklif-talepleri" element={<TeklifTalepleri />} />
            <Route path="loglar" element={<Loglar />} />
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
        <Route path="/rnl-panel/*" element={<AdminRoutes />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<PageLoader fullScreen />}>
              <AdminGateway />
            </Suspense>
          }
        />
        <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
