import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProjectCard from './ProjectCard'
import FeaturedProjectHero from './FeaturedProjectHero'
import { ProjelerimizSkeleton } from './Skeletons'
import { fetchFeaturedProjects } from '../api/projects'

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchFeaturedProjects()
      .then((data) => { if (!cancelled) setProjects(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Ana sayfada hata kutusu göstermiyoruz: liste boşsa veya istek başarısızsa bölüm hiç render edilmez
  if (!loading && projects.length === 0) return null

  return (
    <section id="one-cikan-projeler" className="relative py-24 bg-gray-50 overflow-hidden">
      <img
        src="/stats-bg.webp"
        alt=""
        width="1440"
        height="611"
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-35 mix-blend-multiply pointer-events-none select-none z-0"
        loading="lazy"
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="block text-[#357228] font-semibold text-sm mb-3">PROJELERİMİZ</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">
            Öne Çıkan Projelerimiz
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Sahada hayata geçirdiğimiz güneş enerjisi sistemlerinden bazıları.
          </p>
        </div>

        {loading ? (
          <ProjelerimizSkeleton count={3} />
        ) : projects.length === 1 ? (
          <FeaturedProjectHero p={projects[0]} />
        ) : (
          // 2 projede kartlar ortalanır; 3+ projede standart 3 kolonlu grid
          <div
            className={
              projects.length === 2
                ? 'grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto'
                : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-8'
            }
          >
            {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/projelerimiz"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold text-base px-8 py-3.5 rounded-xl transition-colors"
          >
            Tüm Projeleri Gör
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
