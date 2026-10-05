import { Link } from 'react-router-dom'
import { MapPin, Zap, Calendar } from 'lucide-react'
import { mediaUrl } from '../api/projects'

function coverPhoto(p) {
  const thumb = p.media?.find((m) => m.type === 'thumbnail')
  if (thumb) return mediaUrl(thumb.src)
  const sorted = [...(p.media || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const first = sorted.find((m) => m.type === 'image')
  return first ? mediaUrl(first.src) : null
}

export default function ProjectCard({ p }) {
  const cover = coverPhoto(p)
  return (
    <Link
      to={`/projelerimiz/${p.slug}`}
      className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-[#448834]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
    >
      <div className="h-56 overflow-hidden relative bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={`${p.name} - ${p.location} güneş enerjisi sistemi`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center text-gray-300"
          style={{ display: cover ? 'none' : 'flex' }}
        >
          <Zap size={32} />
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-2">{p.name}</h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{p.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {p.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {p.date}
            </span>
          </div>
          <span className="text-[#448834] font-bold text-lg font-['Rajdhani'] flex items-center gap-1">
            <Zap size={13} className="text-[#448834]" />
            {p.kw} kW
          </span>
        </div>
      </div>
    </Link>
  )
}
