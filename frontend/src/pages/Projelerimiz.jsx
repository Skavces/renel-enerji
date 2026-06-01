import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Zap, Calendar } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { fetchProjects, mediaUrl } from '../api/projects'

export default function Projelerimiz() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalKw = projects.reduce((sum, p) => sum + Number(p.kw), 0)

  const coverPhoto = (p) => {
    const sorted = [...(p.media || [])].sort((a, b) => b.sortOrder - a.sortOrder)
    const first = sorted.find((m) => m.type === 'image')
    return first ? mediaUrl(first.src) : null
  }

  return (
    <>
      <PageHeader title="Projelerimiz" />

      {/* Intro */}
      <section className="bg-gray-50 border-b border-gray-100 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">Gerçekleştirdiklerimiz</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Tamamlanan Projelerimiz</h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Manisa ve çevresinde hayata geçirdiğimiz güneş enerjisi projeleri. Her biri ihtiyaca özel tasarlanmış,
            anahtar teslim tamamlanmış projelerimiz.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 border-b border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {[
            { v: projects.length.toString(), l: 'Tamamlanan Proje' },
            { v: `${Math.round(totalKw * 10) / 10} kW`, l: 'Toplam Kurulu Güç' },
            { v: 'Manisa', l: 'Hizmet Bölgesi' },
          ].map(({ v, l }) => (
            <div key={l} className="text-center px-6 py-4">
              <p className="text-[#448834] font-bold text-4xl font-['Rajdhani'] leading-none mb-1">{v}</p>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-2">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Projeler yükleniyor...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">Henüz proje eklenmemiş.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to={`/projelerimiz/${p.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-[#448834]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="h-56 overflow-hidden relative bg-gray-100">
                    {coverPhoto(p) ? (
                      <img
                        src={coverPhoto(p)}
                        alt={`${p.name} - ${p.location} güneş enerjisi sistemi`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) = loading="lazy"> {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full items-center justify-center text-gray-300"
                      style={{ display: coverPhoto(p) ? 'none' : 'flex' }}
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
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16 border-t border-gray-100 relative bg-cover bg-center"
        style={{ backgroundImage: "url('/stats-bg.webp')" }}
      >
        <div className="absolute inset-0 bg-white/50" />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Projenizi birlikte hayata geçirelim</h3>
          <p className="text-gray-500 mb-6">Ücretsiz keşif ve fizibilite analizi için hemen iletişime geçin.</p>
          <Link
            to="/iletisim"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-[#448834]/25"
          >
            Teklif Al
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  )
}
