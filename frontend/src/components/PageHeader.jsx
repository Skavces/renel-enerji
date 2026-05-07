import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function PageHeader({ title, parent }) {
  return (
    <div className="relative h-40 flex items-center overflow-hidden">
      <img
        src="/panael-bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link to="/" className="text-white/60 hover:text-white transition-colors">Ana Sayfa</Link>
          {parent && (
            <>
              <ChevronRight size={14} className="text-white/40" />
              <Link to={parent.to} className="text-white/60 hover:text-white transition-colors">{parent.label}</Link>
            </>
          )}
          <ChevronRight size={14} className="text-white/40" />
          <span className="text-[#f5ce31] font-semibold">{title}</span>
        </nav>
      </div>
    </div>
  )
}
