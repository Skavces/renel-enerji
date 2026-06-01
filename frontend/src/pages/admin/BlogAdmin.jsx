import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react'
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
import { fetchAllBlogPosts, deleteBlogPost, reorderBlogPosts } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const API = import.meta.env.VITE_API_URL || ''

function SortableRow({ post, onDelete, deletingId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: post.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  }

  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(post.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-gray-50/50 transition-colors bg-white">
      <td className="px-4 py-4 w-10">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} />
        </button>
      </td>
      <td className="px-3 py-4 w-20">
        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
          {post.coverImage ? (
            <img src={`${API}${post.coverImage}`} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300 text-xs">Görsel yok</span>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="font-semibold text-gray-900 text-base leading-snug">{post.title}</p>
        {post.excerpt && <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{post.excerpt}</p>}
        <p className="text-xs text-gray-300 mt-1">/blog/{post.slug}</p>
      </td>
      <td className="px-5 py-4 text-sm text-gray-400">{date}</td>
      <td className="px-5 py-4">
        {post.published ? (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <Eye size={14} /> Yayında
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-gray-400">
            <EyeOff size={14} /> Taslak
          </span>
        )}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 justify-end">
          <Link
            to={`/admin/blog/${post.id}/duzenle`}
            className="p-2 text-gray-400 hover:text-[#448834] hover:bg-green-50 rounded-lg transition-colors"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={() => onDelete(post.id, post.title)}
            disabled={deletingId === post.id}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function BlogAdmin() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = () => {
    setLoading(true)
    fetchAllBlogPosts()
      .then(setPosts)
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
    const oldIndex = posts.findIndex((p) => p.id === active.id)
    const newIndex = posts.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(posts, oldIndex, newIndex)
    setPosts(reordered)
    setSaving(true)
    try {
      await reorderBlogPosts(reordered.map((p) => p.id))
    } catch {
      // sessizce geç
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`"${title}" yazısını silmek istediğinize emin misiniz?`)) return
    setDeletingId(id)
    try {
      await deleteBlogPost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Yazıları</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {posts.length} yazı
            {saving && <span className="ml-2 text-[#448834]">· kaydediliyor...</span>}
          </p>
        </div>
        <Link
          to="/admin/blog/yeni"
          className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={16} />
          Yeni Yazı
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">Henüz blog yazısı yok.</p>
          <Link to="/admin/blog/yeni" className="text-[#448834] font-semibold hover:underline">
            İlk yazıyı ekle
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-4 py-4 w-10" />
                <th className="text-left px-3 py-4 font-medium w-20">Kapak</th>
                <th className="text-left px-5 py-4 font-medium">Başlık</th>
                <th className="text-left px-5 py-4 font-medium">Tarih</th>
                <th className="text-left px-5 py-4 font-medium">Durum</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {posts.map((post) => (
                    <SortableRow
                      key={post.id}
                      post={post}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      )}
    </main>
  )
}
