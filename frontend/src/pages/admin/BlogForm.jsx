import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X } from 'lucide-react'
import {
  fetchAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  uploadBlogCover,
} from '../../api/admin'
import RichTextEditor from '../../components/RichTextEditor'

const API = import.meta.env.VITE_API_URL || ''

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function BlogForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const coverInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    metaDescription: '',
    content: '',
    published: false,
  })
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    fetchAllBlogPosts().then((posts) => {
      const post = posts.find((p) => p.id === id)
      if (!post) { navigate('/admin/blog'); return }
      setForm({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        metaDescription: post.metaDescription || '',
        content: post.content || '',
        published: post.published || false,
      })
      if (post.coverImage) setCoverPreview(`${API}${post.coverImage}`)
      setSlugManual(true)
      setLoading(false)
    })
  }, [id])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleTitleChange = (val) => {
    set('title', val)
    if (!slugManual) set('slug', slugify(val))
  }

  const handleCoverChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Başlık zorunludur.'); return }
    if (!form.slug.trim()) { setError('Slug zorunludur.'); return }
    if (!form.content.trim()) { setError('İçerik zorunludur.'); return }

    setSaving(true)
    try {
      let post
      if (isEdit) {
        post = await updateBlogPost(id, form)
      } else {
        post = await createBlogPost(form)
      }
      if (coverFile) {
        await uploadBlogCover(post.id, coverFile)
      }
      navigate('/admin/blog')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <button
        onClick={() => navigate('/admin/blog')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Blog Yazıları
      </button>

      <h1 className="text-xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Başlık */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Başlık *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Yazı başlığı"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }}
            placeholder="url-adresi"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
          <p className="text-xs text-gray-400 mt-1">renelenerji.com/blog/{form.slug || '...'}</p>
        </div>

        {/* Özet */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kısa Özet</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Blog listesinde görünecek kısa açıklama (opsiyonel)"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
        </div>

        {/* Meta Açıklama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Açıklama <span className="text-gray-400 font-normal">(Google arama sonucu)</span></label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => set('metaDescription', e.target.value)}
            placeholder="Boş bırakılırsa kısa özet kullanılır. Maks. 160 karakter önerilir."
            rows={2}
            maxLength={160}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
          />
          <p className="text-xs text-gray-400 mt-1">{form.metaDescription.length}/160</p>
        </div>

        {/* Kapak Görseli */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Kapak Görseli</label>
          {coverPreview ? (
            <div className="relative w-full h-52 rounded-xl overflow-hidden group">
              <img src={coverPreview} alt="Kapak" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#448834] hover:text-[#448834] transition-colors"
            >
              <Upload size={22} />
              <span className="text-sm">Kapak görseli yükle</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* İçerik */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">İçerik *</label>
          <RichTextEditor value={form.content} onChange={(val) => set('content', val)} />
        </div>

        {/* Yayın Durumu */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5">
          <button
            type="button"
            onClick={() => set('published', !form.published)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.published ? 'bg-[#448834]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {form.published ? 'Yayında' : 'Taslak'}
            </p>
            <p className="text-xs text-gray-400">
              {form.published ? 'Yazı herkese görünür' : 'Yalnızca admin görebilir'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#448834] hover:bg-[#357228] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'Yazıyı Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/blog')}
            className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
        </div>
      </form>
    </main>
  )
}
