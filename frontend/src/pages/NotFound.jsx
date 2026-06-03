import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Sun } from 'lucide-react'
import SEO from '../components/SEO'

export default function NotFound() {
  return (
    <>
      <SEO title="Sayfa Bulunamadı" noindex />
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white -mt-16">
        <div className="text-center max-w-lg">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Sun size={80} className="text-[#448834] opacity-20" strokeWidth={1} />
              <span className="absolute inset-0 flex items-center justify-center text-5xl font-black text-[#448834]">
                404
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Sayfa Bulunamadı
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#448834] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3a7329] transition-colors"
            >
              <Home size={18} />
              Ana Sayfaya Dön
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              Geri Git
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
