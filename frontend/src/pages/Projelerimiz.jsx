import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { ProjelerimizSkeleton } from '../components/Skeletons'
import LoadError from '../components/LoadError'
import ProjectCard from '../components/ProjectCard'
import { fetchProjects } from '../api/projects'
import SEO from '../components/SEO'

export default function Projelerimiz() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function load() {
    setLoading(true)
    setError(false)
    fetchProjects()
      .then(setProjects)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  const totalKw = projects.reduce((sum, p) => sum + Number(p.kw), 0)

  const jsonLd = projects.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Projelerimiz | RenEl Enerji Mühendislik',
    url: 'https://renelenerji.com/projelerimiz',
    description: 'RenEl Enerji\'nin tamamladığı güneş enerjisi projeleri. Tarımsal sulama GES, off-grid çözümler, çatı tipi GES ve hibrit sistemler.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: projects.length,
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://renelenerji.com/projelerimiz/${p.slug}`,
        name: p.name,
      })),
    },
  } : undefined

  return (
    <>
      <SEO
        title="Projelerimiz"
        description="RenEl Enerji'nin tamamladığı güneş enerjisi projeleri. Tarımsal sulama GES, off-grid çözümler, çatı tipi GES ve hibrit sistemler — Soma, Manisa ve çevre illerde."
        jsonLd={jsonLd}
      />
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
            <ProjelerimizSkeleton />
          ) : error ? (
            <LoadError message="Projeler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin." onRetry={load} />
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">Henüz proje eklenmemiş.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
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
