import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createReference, updateReference, fetchAllReferences, uploadReferenceLogo } from '../../api/admin'


import { API } from '../../api/config.js'

const empty = { name: '', published: true, sortOrder: 0 }

export default function ReferansForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(empty)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    if (!isEdit) return
    fetchAllReferences()
      .then((list) => {
        const ref = list.find((r) => r.id === id)
        if (ref) {
          setForm({ name: ref.name, published: ref.published, sortOrder: ref.sortOrder })
          if (ref.logo) setLogoPreview(`${API}${ref.logo}`)
        }
      })
      .catch(() => setError('Referans yüklenemedi'))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) }
      let saved
      if (isEdit) {
        saved = await updateReference(id, payload)
      } else {
        saved = await createReference(payload)
      }
      if (logoFile) {
        await uploadReferenceLogo(saved.id, logoFile)
      }
      navigate('/admin/referanslar')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-8">
        <Link
          to="/admin/referanslar"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6"
        >
          <ArrowLeft size={14} />
          Geri
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Referansı Düzenle' : 'Yeni Referans'}
        </h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div
                  onClick={() => fileRef.current.click()}
                  className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#448834]/40 hover:bg-green-50/30 transition-colors"
                >
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="logo"
                        className="max-h-24 max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null) }}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full border border-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={13} />
                      </button>
                      <p className="text-xs text-gray-400 mt-3">Değiştirmek için tıkla</p>
                    </>
                  ) : (
                    <>
                      <Upload size={22} className="text-gray-300 mb-2" />
                      <p className="text-sm text-gray-400">Logo yükle</p>
                      <p className="text-xs text-gray-300 mt-1">PNG, SVG, JPG, WebP</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Firma / Müşteri Adı <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz Tarım İşletmesi"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#448834]/30 focus:border-[#448834]"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(e) => set('published', e.target.checked)}
                      className="w-4 h-4 accent-[#448834]"
                    />
                    <span className="text-sm text-gray-700">Yayınla</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link
                to="/admin/referanslar"
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg bg-white transition-colors"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm font-bold bg-[#448834] hover:bg-[#357228] text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
    </main>
  )
}
