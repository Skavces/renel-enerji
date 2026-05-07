import { useEffect, useState } from 'react'
import { fetchReferences } from '../api/references'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function LogoMarquee() {
  const [refs, setRefs] = useState([])

  useEffect(() => {
    fetchReferences().then(setRefs).catch(() => {})
  }, [])

  if (refs.length === 0) return null

  const doubled = [...refs, ...refs]

  return (
    <section className="pt-10 pb-28 bg-white overflow-hidden">
      <div className="text-center mb-16">
        <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">RenEl Enerji</p>
        <h2 className="text-4xl font-bold text-gray-900">Bizi Tercih Edenler</h2>
      </div>
      <div className="flex gap-12 animate-[marquee_30s_linear_infinite] w-max items-center">
        {doubled.map((r, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            {r.logo ? (
              <img
                src={`${API}${r.logo}`}
                alt={r.name}
                className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              />
            ) : (
              <span className="text-gray-300 font-semibold text-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#448834] inline-block shrink-0" />
                {r.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
