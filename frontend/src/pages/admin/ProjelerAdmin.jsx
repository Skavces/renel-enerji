import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, RefreshCw } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchAllProjects, deleteProject, reorderProjects, syncInstagram } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { mediaUrl } from '../../api/projects'

function SortableRow({ p, coverPhoto, onDelete, deletingId }) {
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
        {p.published ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Eye size={14} /> Yayında
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <EyeOff size={14} /> Gizli
          </span>
        )}
      </td>
      <td className="px-5 py-5">
        <div className="flex items-center gap-2 justify-end">
          <Link
            to={`/admin/projeler/${p.id}/duzenle`}
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = () => {
    setLoading(true)
    fetchAllProjects()
      .then(setProjects)
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout()
          navigate('/admin/login')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = projects.findIndex((p) => p.id === active.id)
    const newIndex = projects.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(projects, oldIndex, newIndex)
    setProjects(reordered)
    setSaving(true)
    try {
      await reorderProjects(reordered.map((p) => p.id))
    } catch {
      // sessizce geç, sıra kaydedilemese de UI güncel
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await syncInstagram()
      setSyncResult(result)
      if (result.imported > 0) load()
    } catch (err) {
      alert('Instagram senkronizasyonu başarısız: ' + err.message)
    } finally {
      setSyncing(false)
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
    const first = p.media?.find((m) => m.type === 'image')
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
              {syncResult && (
                <span className="ml-2 text-[#448834]">
                  · {syncResult.imported} yeni proje eklendi{syncResult.skipped > 0 ? `, ${syncResult.skipped} atlandı` : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-[#448834] hover:text-[#448834] text-gray-600 font-semibold px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Çekiliyor...' : 'Instagram\'dan Çek'}
            </button>
            <Link
              to="/admin/projeler/yeni"
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
            <Link to="/admin/projeler/yeni" className="text-[#448834] font-semibold hover:underline">
              İlk projeyi ekle
            </Link>
          </div>
        ) : (
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
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </DndContext>
            </table>
            </div>
          </div>
        )}
    </main>
  )
}
