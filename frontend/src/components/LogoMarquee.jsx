import { useEffect, useRef, useState } from 'react'
import { fetchReferences } from '../api/references'

const API = import.meta.env.VITE_API_URL || ''

function LogoStrip({ refs, measureRef }) {
  return (
    <div ref={measureRef} className="flex items-center gap-16 shrink-0 pr-16">
      {refs.map((r, i) => (
        <div key={i} className="shrink-0">
          {r.logo ? (
            <img
              src={`${API}${r.logo}`}
              alt={r.name}
              className="h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100" loading="lazy" />
          ) : (
            <span className="text-gray-300 font-semibold text-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#448834] inline-block shrink-0" />
              {r.name}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function LogoMarquee() {
  const [refs, setRefs] = useState([])
  const stripRef = useRef(null)
  const [stripWidth, setStripWidth] = useState(null)

  useEffect(() => {
    fetchReferences().then(setRefs).catch(() => {})
  }, [])

  useEffect(() => {
    if (stripRef.current && refs.length > 0) {
      setStripWidth(stripRef.current.offsetWidth)
    }
  }, [refs])

  if (refs.length === 0) return null

  return (
    <section className="pt-10 pb-28 bg-white overflow-hidden">
      <div className="text-center mb-16">
        <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">RenEl Enerji</p>
        <h2 className="text-4xl font-bold text-gray-900">Bizi Tercih Edenler</h2>
      </div>

      {stripWidth && (
        <style>{`@keyframes marquee-logos { to { transform: translateX(-${stripWidth}px); } }`}</style>
      )}

      <div
        className="flex will-change-transform"
        style={stripWidth ? { animation: 'marquee-logos 20s linear infinite' } : {}}
      >
        <LogoStrip refs={refs} measureRef={stripRef} />
        <LogoStrip refs={refs} />
      </div>
    </section>
  )
}
