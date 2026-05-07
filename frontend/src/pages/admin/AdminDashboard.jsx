import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, FolderOpen, Star, Plus, EyeOff, ArrowRight } from 'lucide-react'
import { fetchAllProjects, fetchAllReferences } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { mediaUrl } from '../../api/projects'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [projects, setProjects] = useState([])
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllProjects(), fetchAllReferences()])
      .then(([p, r]) => { setProjects(p); setRefs(r) })
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout()
          navigate('/admin/login')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const publishedProjects = projects.filter((p) => p.published)
  const publishedRefs = refs.filter((r) => r.published)
  const totalProjectKw = projects.reduce((s, p) => s + parseFloat(p.kw || 0), 0)

  const coverPhoto = (p) => {
    const first = p.media?.find((m) => m.type === 'image')
    return first ? mediaUrl(first.src) : null
  }

  const stats = [
    { label: 'Toplam Proje', value: projects.length, sub: `${publishedProjects.length} yayında`, icon: FolderOpen, color: 'text-blue-600 bg-blue-50' },
    { label: 'Toplam Referans', value: refs.length, sub: `${publishedRefs.length} yayında`, icon: Star, color: 'text-orange-500 bg-orange-50' },
    { label: 'Kurulu Güç', value: `${totalProjectKw % 1 === 0 ? totalProjectKw : totalProjectKw.toFixed(1)} kW`, sub: 'tüm projeler', icon: Zap, color: 'text-green-600 bg-green-50' },
    { label: 'Gizli İçerik', value: (projects.length - publishedProjects.length) + (refs.length - publishedRefs.length), sub: 'yayınlanmayan', icon: EyeOff, color: 'text-gray-500 bg-gray-100' },
  ]

  return (
    <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                <div className={`inline-flex shrink-0 ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{s.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hızlı aksiyonlar */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/admin/projeler/yeni"
              className="group bg-white hover:bg-green-50/40 border border-gray-100 rounded-xl p-6 flex items-center justify-between transition-colors border-l-4 border-l-[#448834]"
            >
              <div>
                <p className="font-semibold text-base text-gray-800">Yeni Proje Ekle</p>
                <p className="text-gray-400 text-sm mt-0.5">Fotoğraf ve detaylarla yeni proje oluştur</p>
              </div>
              <Plus size={22} className="text-[#448834] opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              to="/admin/referanslar/yeni"
              className="group bg-white hover:bg-yellow-50/40 border border-gray-100 rounded-xl p-6 flex items-center justify-between transition-colors border-l-4 border-l-[#f5ce31]"
            >
              <div>
                <p className="font-semibold text-base text-gray-800">Yeni Referans Ekle</p>
                <p className="text-gray-400 text-sm mt-0.5">Tamamlanan müşteri projesini kaydet</p>
              </div>
              <Plus size={22} className="text-[#f5ce31] opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          {/* Son içerikler */}
          <div className="grid lg:grid-cols-2 gap-4">

            {/* Son projeler */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Son Projeler</h3>
                <Link to="/admin/projeler" className="text-sm text-[#448834] hover:underline flex items-center gap-1">
                  Tümü <ArrowRight size={13} />
                </Link>
              </div>
              {projects.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Henüz proje yok</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {projects.slice(0, 5).map((p) => (
                    <li key={p.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                      {coverPhoto(p) ? (
                        <img src={coverPhoto(p)} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0 bg-gray-100" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.kw} kW</p>
                      </div>
                      {p.published
                        ? <Eye size={14} className="text-green-500 shrink-0" />
                        : <EyeOff size={14} className="text-gray-300 shrink-0" />
                      }
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Son referanslar */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800">Son Referanslar</h3>
                <Link to="/admin/referanslar" className="text-sm text-[#448834] hover:underline flex items-center gap-1">
                  Tümü <ArrowRight size={13} />
                </Link>
              </div>
              {refs.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-1">Henüz referans yok</p>
                  <Link to="/admin/referanslar/yeni" className="text-sm text-[#448834] hover:underline">İlk referansı ekle</Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {refs.slice(0, 5).map((r) => (
                    <li key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                      <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                        {r.logo
                          ? <img src={`${API}${r.logo}`} alt={r.name} className="w-full h-full object-contain" />
                          : <Star size={16} className="text-orange-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                      </div>
                      {r.published
                        ? <Eye size={14} className="text-green-500 shrink-0" />
                        : <EyeOff size={14} className="text-gray-300 shrink-0" />
                      }
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
