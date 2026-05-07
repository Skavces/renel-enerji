import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Upload, X, GripVertical,
} from 'lucide-react'
import {
  createProject, updateProject, fetchAllProjects,
  uploadMedia, deleteMedia, reorderMedia,
} from '../../api/admin'
import { mediaUrl } from '../../api/projects'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const EMPTY = {
  slug: '', name: '', location: '', kw: '', date: '', category: '',
  description: '', about: '', specsTitle: 'Sistem Özellikleri', specs: [],
  highlightsTitle: 'Öne Çıkan Özellikler', highlights: [],
  statBoxes: [], ctaText: 'Benzer Proje İçin Teklif Al',
  published: true, sortOrder: 0,
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ProjeForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState(EMPTY)
  const [existingMedia, setExistingMedia] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [error, setError] = useState('')
  const [slugManual, setSlugManual] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    fetchAllProjects()
      .then((projects) => {
        const p = projects.find((x) => x.id === id)
        if (!p) { navigate('/admin/projeler'); return }
        setForm({
          slug: p.slug, name: p.name, location: p.location, kw: p.kw,
          date: p.date, category: p.category, description: p.description,
          about: p.about || '', specsTitle: p.specsTitle, specs: p.specs || [],
          highlightsTitle: p.highlightsTitle, highlights: p.highlights || [],
          statBoxes: p.statBoxes || [], ctaText: p.ctaText,
          published: p.published, sortOrder: p.sortOrder,
        })
        const sorted = [...(p.media || [])].sort((a, b) => a.sortOrder - b.sortOrder)
        setExistingMedia(sorted)
        setSlugManual(true)
      })
      .catch(() => { logout(); navigate('/admin/login') })
      .finally(() => setLoading(false))
  }, [id])

  const set = (key, val) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      if (key === 'name' && !slugManual) next.slug = slugify(val)
      return next
    })
  }

  const addListItem = (key) => setForm((p) => ({ ...p, [key]: [...p[key], ''] }))
  const updateListItem = (key, i, val) =>
    setForm((p) => { const arr = [...p[key]]; arr[i] = val; return { ...p, [key]: arr } })
  const removeListItem = (key, i) =>
    setForm((p) => ({ ...p, [key]: p[key].filter((_, idx) => idx !== i) }))

  const addStatBox = () =>
    setForm((p) => ({ ...p, statBoxes: [...p.statBoxes, { value: '', label: '' }] }))
  const updateStatBox = (i, field, val) =>
    setForm((p) => {
      const arr = [...p.statBoxes]
      arr[i] = { ...arr[i], [field]: val }
      return { ...p, statBoxes: arr }
    })
  const removeStatBox = (i) =>
    setForm((p) => ({ ...p, statBoxes: p.statBoxes.filter((_, idx) => idx !== i) }))

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files)
    setNewFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeNewFile = (i) => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))

  const handleDeleteExisting = async (mediaId) => {
    if (!confirm('Bu medyayı silmek istediğinize emin misiniz?')) return
    try {
      await deleteMedia(id, mediaId)
      setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId))
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, kw: Number(form.kw), sortOrder: Number(form.sortOrder) }
      let project
      if (isEdit) {
        project = await updateProject(id, payload)
      } else {
        project = await createProject(payload)
      }

      if (newFiles.length > 0) {
        setUploadingMedia(true)
        await uploadMedia(project.id, newFiles)
        setNewFiles([])
      }

      navigate('/admin/projeler')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
      setUploadingMedia(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Yükleniyor...</div>
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/projeler" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Temel Bilgiler */}
          <Section title="Temel Bilgiler">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Proje Adı" required>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={INPUT}
                  required
                />
              </Field>
              <Field label="Slug (URL)" required>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugManual(true); set('slug', e.target.value) }}
                  className={INPUT}
                  required
                  placeholder="ornek-proje-slug"
                />
              </Field>
              <Field label="Konum" required>
                <input value={form.location} onChange={(e) => set('location', e.target.value)} className={INPUT} required />
              </Field>
              <Field label="Kategori" required>
                <input value={form.category} onChange={(e) => set('category', e.target.value)} className={INPUT} required placeholder="Depolamalı GES" />
              </Field>
              <Field label="Kurulu Güç (kW)" required>
                <input type="number" step="0.01" value={form.kw} onChange={(e) => set('kw', e.target.value)} className={INPUT} required />
              </Field>
              <Field label="Yıl" required>
                <input value={form.date} onChange={(e) => set('date', e.target.value)} className={INPUT} required placeholder="2025" />
              </Field>
            </div>
            <Field label="Kısa Açıklama (liste sayfasında görünür)" required>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={`${INPUT} resize-none`}
                rows={2}
                required
              />
            </Field>
            <Field label="Proje Hakkında (detay sayfasında görünür)">
              <textarea
                value={form.about}
                onChange={(e) => set('about', e.target.value)}
                className={`${INPUT} resize-none`}
                rows={4}
                placeholder="Proje hakkında detaylı açıklama..."
              />
            </Field>
          </Section>

          {/* Sistem Özellikleri */}
          <Section title="Sistem Özellikleri">
            <Field label="Bölüm Başlığı">
              <input value={form.specsTitle} onChange={(e) => set('specsTitle', e.target.value)} className={INPUT} />
            </Field>
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={(e) => updateListItem('specs', i, e.target.value)}
                    className={`${INPUT} flex-1`}
                    placeholder={`Özellik ${i + 1}`}
                  />
                  <button type="button" onClick={() => removeListItem('specs', i)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addListItem('specs')}
                className="flex items-center gap-1.5 text-sm text-[#448834] hover:text-[#357228] font-medium">
                <Plus size={15} /> Özellik Ekle
              </button>
            </div>
          </Section>

          {/* Öne Çıkan Özellikler */}
          <Section title="Öne Çıkan Özellikler">
            <Field label="Bölüm Başlığı">
              <input value={form.highlightsTitle} onChange={(e) => set('highlightsTitle', e.target.value)} className={INPUT} />
            </Field>
            <div className="space-y-2">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h}
                    onChange={(e) => updateListItem('highlights', i, e.target.value)}
                    className={`${INPUT} flex-1`}
                    placeholder={`Özellik ${i + 1}`}
                  />
                  <button type="button" onClick={() => removeListItem('highlights', i)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addListItem('highlights')}
                className="flex items-center gap-1.5 text-sm text-[#448834] hover:text-[#357228] font-medium">
                <Plus size={15} /> Özellik Ekle
              </button>
            </div>
          </Section>

          {/* İstatistik Kutuları */}
          <Section title="İstatistik Kutuları">
            <div className="space-y-3">
              {form.statBoxes.map((box, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      value={box.value}
                      onChange={(e) => updateStatBox(i, 'value', e.target.value)}
                      className={INPUT}
                      placeholder="10,2 kW"
                    />
                    <input
                      value={box.label}
                      onChange={(e) => updateStatBox(i, 'label', e.target.value)}
                      className={INPUT}
                      placeholder="Kurulu Güç"
                    />
                  </div>
                  <button type="button" onClick={() => removeStatBox(i)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addStatBox}
                className="flex items-center gap-1.5 text-sm text-[#448834] hover:text-[#357228] font-medium">
                <Plus size={15} /> Kutu Ekle
              </button>
            </div>
          </Section>

          {/* Medya */}
          <Section title="Fotoğraf & Video">
            {isEdit && existingMedia.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Mevcut Medya</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {existingMedia.map((m) => (
                    <div key={m.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {m.type === 'video' ? (
                        <video src={mediaUrl(m.src)} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={mediaUrl(m.src)} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteExisting(m.id)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                {isEdit ? 'Yeni Dosya Ekle' : 'Dosyalar Seç'}
              </p>
              {newFiles.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                  {newFiles.map((f, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {f.type.startsWith('video') ? (
                        <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#448834] text-gray-400 hover:text-[#448834] rounded-xl px-4 py-3 text-sm font-medium transition-colors w-full justify-center"
              >
                <Upload size={16} />
                Dosya Seç (Fotoğraf veya Video)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFilePick}
              />
            </div>
          </Section>

          {/* Diğer */}
          <Section title="Diğer Ayarlar">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="CTA Butonu Metni">
                <input value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} className={INPUT} />
              </Field>

            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set('published', e.target.checked)}
                className="w-4 h-4 accent-[#448834]"
              />
              <span className="text-sm font-medium text-gray-700">Sitede yayınla</span>
            </label>
          </Section>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#448834] hover:bg-[#357228] disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              {saving
                ? (uploadingMedia ? 'Medya yükleniyor...' : 'Kaydediliyor...')
                : (isEdit ? 'Değişiklikleri Kaydet' : 'Proje Oluştur')}
            </button>
            <Link to="/admin/projeler" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              İptal
            </Link>
          </div>
        </form>
    </main>
  )
}

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide text-[#448834]">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
