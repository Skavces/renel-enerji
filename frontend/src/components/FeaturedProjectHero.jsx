import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Zap, Calendar, ArrowRight, Play } from 'lucide-react'
import { projectCover } from '../lib/projectCover'
import VideoModal from './VideoModal'

// Tek öne çıkan proje olduğunda 3 kolonlu gridde sol köşede yalnız kalmasın diye
// geniş, yatay kart: solda kapak, sağda açıklama + teknik veriler (statBoxes).
// Kapak video ise kart görününce sessiz döngüde oynar; tıklayınca modalda sesli açılır.
export default function FeaturedProjectHero({ p }) {
  const { image, video } = projectCover(p)
  const stats = (p.statBoxes || []).slice(0, 4)
  const [modalOpen, setModalOpen] = useState(false)
  const videoRef = useRef(null)
  const detailPath = `/projelerimiz/${p.slug}`

  // Video kart görünene kadar indirilmez; görünmez olunca durur
  useEffect(() => {
    const el = videoRef.current
    if (!el || !video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.getAttribute('src')) el.src = video
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [video])

  const mediaClass = 'relative block h-64 md:h-auto md:min-h-[22rem] overflow-hidden bg-gray-100 w-full text-left'
  const imgClass = 'absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
  const alt = `${p.name} - ${p.location} güneş enerjisi sistemi`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-900/5 hover:shadow-xl hover:border-[#448834]/20 transition-shadow duration-300 grid md:grid-cols-2 overflow-hidden group max-w-5xl mx-auto">
      {video ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label={`${p.name} videosunu oynat`}
          className={`${mediaClass} cursor-pointer`}
        >
          <video
            ref={videoRef}
            poster={image || undefined}
            muted
            loop
            playsInline
            preload="none"
            className={imgClass}
          />
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-14 h-14 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-black/60 transition-colors">
              <Play size={24} fill="currentColor" className="ml-0.5" />
            </span>
          </span>
        </button>
      ) : (
        <Link to={detailPath} className={mediaClass}>
          {image ? (
            <img src={image} alt={alt} className={imgClass} loading="lazy" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-gray-300">
              <Zap size={40} />
            </span>
          )}
        </Link>
      )}

      <Link to={detailPath} className="p-6 md:p-8 flex flex-col">
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {p.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {p.date}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-xl leading-tight mb-3">{p.name}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">{p.description}</p>

        {stats.length > 0 ? (
          <dl className="grid grid-cols-2 gap-3 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl px-4 py-3">
                <dd className="text-[#448834] font-bold text-lg font-['Rajdhani'] leading-tight">{s.value}</dd>
                <dt className="text-gray-500 text-xs mt-0.5">{s.label}</dt>
              </div>
            ))}
          </dl>
        ) : (
          <span className="text-[#448834] font-bold text-2xl font-['Rajdhani'] flex items-center gap-1 mb-6">
            <Zap size={18} />
            {p.kw} kW
          </span>
        )}

        <span className="mt-auto inline-flex items-center gap-2 text-[#448834] group-hover:text-[#357228] font-bold text-sm transition-colors">
          Projeyi İncele
          <ArrowRight size={16} />
        </span>
      </Link>

      {modalOpen && video && (
        <VideoModal src={video} title={p.name} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
