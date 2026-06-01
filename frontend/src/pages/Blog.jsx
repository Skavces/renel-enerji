import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const API = import.meta.env.VITE_API_URL || ''

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/blog`)
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <PageHeader title="Blog" />

      <section className="bg-gray-50 border-b border-gray-100 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">Haberler & Yazılar</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Blog</h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Güneş enerjisi, yenilenebilir enerji sistemleri ve sektördeki gelişmeler hakkında bilgi edinebilirsiniz.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>Henüz yazı yayınlanmamış.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-[#448834]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    {post.coverImage ? (
                      <img
                        src={`${API}${post.coverImage}`}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-200 font-['Rajdhani']">BLOG</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-3">
                      <Calendar size={11} />
                      {formatDate(post.publishedAt || post.createdAt)}
                    </p>
                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 flex-1">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
                    )}
                    <span className="text-[#448834] text-sm font-semibold flex items-center gap-1 mt-auto group-hover:gap-2 transition-all">
                      Devamını Oku <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
