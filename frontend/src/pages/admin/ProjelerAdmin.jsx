import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, RefreshCw, Star } from 'lucide-react'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchAllProjects, deleteProject, reorderProjects, reorderFeaturedProjects, syncInstagram, updateProject } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { mediaUrl } from '../../api/projects'
import { useDndReorder } from '../../hooks/useDndReorder.js'

const MAX_FEATURED = 6

function FeaturedItem({ p, coverPhoto, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 bg-white"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={18} />
      </button>
      <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden bg-gray-100">
        {coverPhoto(p) && (
          <img
            src={coverPhoto(p)}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>
      <p className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900">{p.name}</p>
      {!p.published && (
        <span className="text-xs text-amber-600 shrink-0">Yayında değil — ana sayfada görünmez</span>
      )}
      <button
        onClick={() => onRemove(p)}
        title="Öne çıkanlardan kaldır"
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </li>
  )
}

function SortableRow({ p, coverPhoto, onDelete, deletingId, onTogglePublish, togglingId, onToggleFeatured, featuredFull }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: p.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50/50 transition-colors bg-white"
    >
      <td className="px-4 py-5 w-8">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} />
        </button>
      </td>
      <td className="px-3 py-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-gray-100">
            {coverPhoto(p) && (
              <img
                src={coverPhoto(p)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-base leading-tight">{p.name}</p>
            <p className="text-sm text-gray-400 mt-0.5">{p.date}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 text-sm text-gray-500 hidden sm:table-cell">{p.location}</td>
      <td className="px-5 py-5 text-sm font-semibold text-[#448834] hidden sm:table-cell">
        {p.kw} kW
      </td>
      <td className="px-5 py-5">
        <button
          onClick={() => onTogglePublish(p)}
          disabled={togglingId === p.id}
          className="flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40 hover:opacity-70"
        >
          {p.published ? (
            <span className="flex items-center gap-1.5 text-green-600">
              <Eye size={14} /> Yayında
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-400">
              <EyeOff size={14} /> Gizli
            </span>
          )}
        </button>
      </td>
      <td className="px-5 py-5">
        <button
          onClick={() => onToggleFeatured(p)}
          disabled={togglingId === p.id || (!p.featured && featuredFull)}
          title={
            p.featured
              ? 'Öne çıkanlardan kaldır'
              : featuredFull ? `En fazla ${MAX_FEATURED} proje öne çıkarılabilir` : 'Ana sayfada öne çıkar'
          }
          className="p-2 rounded-lg transition-colors disabled:opacity-40 hover:bg-amber-50"
        >
          <Star size={18} className={p.featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
        </button>
      </td>
      <td className="px-5 py-5">
        <div className="flex items-center gap-2 justify-end">
          <Link
            to={`/rnl-panel/projeler/${p.id}/duzenle`}
            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pencil size={17} />
          </Link>
          <button
            onClick={() => onDelete(p.id, p.name)}
            disabled={deletingId === p.id}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ProjelerAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const { sensors, handleDragEnd } = useDndReorder(projects, setProjects, reorderProjects, setSaving)

  const featured = useMemo(
    () => projects.filter((p) => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder),
    [projects],
  )
  const featuredFull = featured.length >= MAX_FEATURED

  const setFeaturedOrder = (reordered) =>
    setProjects((prev) =>
      prev.map((p) => {
        const idx = reordered.findIndex((x) => x.id === p.id)
        return idx === -1 ? p : { ...p, featuredOrder: idx }
      }),
    )

  const { sensors: featuredSensors, handleDragEnd: handleFeaturedDragEnd } = useDndReorder(
    featured,
    setFeaturedOrder,
    reorderFeaturedProjects,
    setSaving,
    (err) => alert('Sıralama kaydedilemedi: ' + err.message),
  )

  const load = () => {
    setLoading(true)
    fetchAllProjects()
      .then(setProjects)
      .catch((err) => {
        if (err.status === 401) {
          logout()
          navigate('/rnl-panel/login')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      await syncInstagram()
      setSyncResult({ started: true })
      setTimeout(() => load(), 30000)
    } catch (err) {
      alert('Instagram senkronizasyonu başarısız: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const handleTogglePublish = async (p) => {
    setTogglingId(p.id)
    try {
      await updateProject(p.id, { published: !p.published })
      setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, published: !p.published } : x))
    } catch (err) {
      alert('Durum değiştirilemedi: ' + err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleToggleFeatured = async (p) => {
    setTogglingId(p.id)
    try {
      await updateProject(p.id, { featured: !p.featured })
      // Yeni öne çıkan listenin sonuna eklenir (backend ile aynı kural)
      const nextOrder = featured.length ? Math.max(...featured.map((x) => x.featuredOrder)) + 1 : 0
      setProjects((prev) => prev.map((x) =>
        x.id === p.id ? { ...x, featured: !p.featured, featuredOrder: p.featured ? x.featuredOrder : nextOrder } : x,
      ))
    } catch (err) {
      alert('Öne çıkarma değiştirilemedi: ' + err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" projesini silmek istediğinize emin misiniz?`)) return
    setDeletingId(id)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const coverPhoto = (p) => {
    const first = p.media?.find((m) => m.type === 'thumbnail') ?? p.media?.find((m) => m.type === 'image')
    return first ? mediaUrl(first.src) : null
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Projeler</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {projects.length} proje
              {saving && <span className="ml-2 text-[#448834]">· kaydediliyor...</span>}
              {syncResult?.started && (
                <span className="ml-2 text-[#448834]">· Instagram sync başlatıldı, 30 saniye sonra yenileniyor...</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-[#448834] hover:text-[#448834] text-gray-600 font-semibold px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{syncing ? 'Çekiliyor...' : 'Instagram\'dan Çek'}</span>
            </button>
            <Link
              to="/rnl-panel/projeler/yeni"
              className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <Plus size={16} />
              Yeni Proje
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="mb-4">Henüz proje yok.</p>
            <Link to="/rnl-panel/projeler/yeni" className="text-[#448834] font-semibold hover:underline">
              İlk projeyi ekle
            </Link>
          </div>
        ) : (
          <>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">
                Ana Sayfada Öne Çıkanlar ({featured.length}/{MAX_FEATURED})
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Aşağıdaki listede yıldıza tıklayarak ekleyin; buradan sürükleyerek sıralayın.
              </p>
            </div>
            {featured.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">Henüz öne çıkan proje yok.</p>
            ) : (
              <DndContext sensors={featuredSensors} collisionDetection={closestCenter} onDragEnd={handleFeaturedDragEnd}>
                <SortableContext items={featured.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <ul className="divide-y divide-gray-50">
                    {featured.map((p) => (
                      <FeaturedItem key={p.id} p={p} coverPhoto={coverPhoto} onRemove={handleToggleFeatured} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-4 w-8" />
                  <th className="text-left px-3 py-4 font-medium">Proje</th>
                  <th className="text-left px-5 py-4 font-medium hidden sm:table-cell">Konum</th>
                  <th className="text-left px-5 py-4 font-medium hidden sm:table-cell">Güç</th>
                  <th className="text-left px-5 py-4 font-medium">Durum</th>
                  <th className="text-left px-5 py-4 font-medium">Öne Çıkan</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-gray-50">
                    {projects.map((p) => (
                      <SortableRow
                        key={p.id}
                        p={p}
                        coverPhoto={coverPhoto}
                        onDelete={handleDelete}
                        deletingId={deletingId}
                        onTogglePublish={handleTogglePublish}
                        togglingId={togglingId}
                        onToggleFeatured={handleToggleFeatured}
                        featuredFull={featuredFull}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>
            </div>
          </div>
          </>
        )}
    </main>
  )
}
