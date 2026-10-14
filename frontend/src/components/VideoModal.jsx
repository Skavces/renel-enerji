import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Tam ekran video oynatıcı. Stil ve davranış ProjeDetay lightbox'ıyla aynı:
// arka plana tıklama, X ve Esc ile kapanır; açıkken sayfa kaydırılmaz.
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} videosu` : 'Video'}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
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
        className="max-h-[85vh] max-w-[90vw] w-auto rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
