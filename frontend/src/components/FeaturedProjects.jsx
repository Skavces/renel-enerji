import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ProjectCard from './ProjectCard'
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
    <section id="one-cikan-projeler" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
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
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to="/projelerimiz"
            className="inline-flex items-center gap-2 text-[#448834] hover:text-[#357228] font-bold transition-colors"
          >
            Tüm Projeleri Gör
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
