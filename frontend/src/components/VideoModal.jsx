import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// Tam ekran video oynatıcı. Stil ve davranış ProjeDetay lightbox'ıyla aynı:
// arka plana tıklama, X ve Esc ile kapanır; açıkken sayfa kaydırılmaz.
// document.body'ye portal ile render edilir: kartın içinde kalırsa üst
// öğelerin z-index'li stacking context'i yüzünden navbar'ın ve sonraki
// bölümlerin altında/üstünde kalıp ekranı kaplamaz.
export default function VideoModal({ src, title, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} videosu` : 'Video'}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Kapat"
        className="absolute top-5 right-5 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X size={28} />
      </button>
      <video
        src={src}
        controls
        autoPlay
        playsInline
        className="max-h-[80vh] max-w-[min(90vw,64rem)] w-auto rounded-xl bg-black"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  )
}
