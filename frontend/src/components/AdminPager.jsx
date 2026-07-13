import { ChevronLeft, ChevronRight } from 'lucide-react'

// Admin listeleri için basit önceki/sonraki sayfalayıcı; tek sayfada gizlenir
export default function AdminPager({ page, pageCount, onChange, disabled = false }) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} /> Önceki
      </button>
      <span className="text-sm text-gray-500 tabular-nums">
        {page} / {pageCount}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= pageCount}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-gray-100 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Sonraki <ChevronRight size={15} />
      </button>
    </div>
  )
}
