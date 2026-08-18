import { useEffect, useRef, useState } from 'react'

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
export function usePageTransitionOverlay(pathname) {
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef(0)
  const showTimerRef = useRef(null)
  const hideTimerRef = useRef(null)
  const maxTimerRef = useRef(null)
  // window.location.pathname, history.pushState ile TIKLAMA ANINDA değişiyor
  // (React'ın kendi pathname state'i transition yüzünden geç günceller) —
  // "hedef zaten aynı sayfa mı" kontrolünü window.location yerine React'ın
  // henüz commit ettiği son pathname'e göre yapmak için bu ref kullanılıyor.
  const pathnameRef = useRef(pathname)
  // "overlay şu an ekranda mı" sorusunun TEK doğru kaynağı — `visible` state'i
  // her değiştiğinde bu ref de AYNI ANDA (show/hide yardımcıları üzerinden)
  // güncelleniyor, böylece ikisi asla birbirinden ayrışamıyor.
  const visibleRef = useRef(false)

  function show() {
    visibleRef.current = true
    shownAtRef.current = performance.now()
    setVisible(true)
  }

  function hide() {
    visibleRef.current = false
    setVisible(false)
  }

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
      if (visibleRef.current) {
        // Önceki navigasyonun overlay'i hâlâ ekranda — yeniden göstermeye
        // gerek yok, sadece minimum gösterim süresini bu tıklamadan itibaren
        // yeniden başlat.
        shownAtRef.current = performance.now()
      } else {
        showTimerRef.current = setTimeout(show, OVERLAY_SHOW_DELAY_MS)
      }
      maxTimerRef.current = setTimeout(hide, OVERLAY_SHOW_DELAY_MS + OVERLAY_MAX_MS)
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
    if (!visibleRef.current) return
    const remaining = OVERLAY_MIN_MS - (performance.now() - shownAtRef.current)
    if (remaining > 0) {
      hideTimerRef.current = setTimeout(hide, remaining)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      hide()
    }
  }, [pathname])

  useEffect(() => () => {
    clearTimeout(showTimerRef.current)
    clearTimeout(hideTimerRef.current)
    clearTimeout(maxTimerRef.current)
  }, [])

  return visible
}
