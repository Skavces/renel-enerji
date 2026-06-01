import { useState } from 'react'
import { Phone, Mail, MapPin, Send, MessageCircle } from 'lucide-react'

const services = [
  'Akıllı Tarımsal Sulama GES',
  'Arazi Tipi GES',
  'Çatı Tipi GES',
  'Bağ Evi Depolamalı GES',
  'Elektrikli Araç Şarj İstasyonu',
  'Diğer',
]

export default function Contact({ hideHeader = false }) {
  const [form, setForm] = useState({ name: '', phone: '', service: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const lines = [
      '🌿 *Yeni Teklif Talebi*',
      '',
      `👤 *Ad Soyad:* ${form.name}`,
      `📞 *Telefon:* ${form.phone}`,
      form.email ? `📧 *E-posta:* ${form.email}` : null,
      form.service ? `⚡ *Hizmet:* ${form.service}` : null,
      form.message ? `💬 *Mesaj:* ${form.message}` : null,
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/905543796004?text=${encodeURIComponent(lines)}`, '_blank')
    setSent(true)
    setTimeout(() => setSent(false), 5000)
    setForm({ name: '', phone: '', service: '', message: '' })
  }

  return (
    <section id="iletisim" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {!hideHeader && (
          <div className="text-center mb-16">
            <span className="inline-block bg-[#448834]/10 text-[#448834] font-semibold text-sm px-4 py-1.5 rounded-full mb-4">
              İLETİŞİM
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ücretsiz Keşif Talebi
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Formu doldurun, mühendisimiz en kısa sürede sizi arasın. Keşif ziyaretimiz tamamen ücretsizdir.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-[#448834] rounded-2xl p-8 text-white flex-1">
              <h3 className="font-bold text-xl mb-6">Bize Ulaşın</h3>

              <div className="space-y-5">
                <a href="tel:+905000000000" className="flex items-start gap-4 group">
                  <Phone size={18} className="text-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-xs mb-0.5">Telefon</p>
                    <p className="font-semibold">+90 (500) 000 00 00</p>
                  </div>
                </a>

                <a href="mailto:info@renelenerjimuhendislik.com" className="flex items-start gap-4 group">
                  <Mail size={18} className="text-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-xs mb-0.5">E-posta</p>
                    <p className="font-semibold text-sm">info@renelenerjimuhendislik.com</p>
                  </div>
                </a>

                <a href="https://maps.google.com/?q=Renel+Enerji+Mühendislik,+Kurtuluş,+İnkılap+Sk.+no:4+D:J,+45500+Soma/Manisa" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                  <MapPin size={18} className="text-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-xs mb-0.5">Konum</p>
                    <p className="font-semibold">Soma / Manisa</p>
                    <p className="text-white/60 text-sm">Kurtuluş, İnkılap Sk. no:4 D:J</p>
                  </div>
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-white/60 text-sm mb-3">Sosyal Medya</p>
                <a
                  href="https://www.instagram.com/renelenerjimuhendislik/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  Instagram'da Takip Et
                </a>
              </div>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/905000000000?text=Merhaba,%20güneş%20enerjisi%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-green-100"
            >
              <MessageCircle size={22} />
              WhatsApp ile Yazın
            </a>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-[#f8faf5] rounded-2xl border border-[#448834]/10 p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Ad Soyad *</label>
                  <input
                    required
                    type="text"
                    placeholder="Adınız Soyadınız"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Telefon *</label>
                  <input
                    required
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">İlgilendiğiniz Hizmet *</label>
                <select
                  required
                  value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all bg-white text-gray-700"
                >
                  <option value="">Seçiniz...</option>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Mesajınız</label>
                <textarea
                  rows={4}
                  placeholder="Projeniz hakkında kısaca bilgi verin..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#448834] hover:bg-[#357228] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#448834]/20 hover:-translate-y-0.5"
              >
                {sent ? 'Gönderildi! En kısa sürede aranacaksınız.' : (
                  <>
                    <Send size={18} />
                    Teklif Talebi Gönder
                  </>
                )}
              </button>

              <p className="text-center text-gray-400 text-xs">
                Keşif ziyareti tamamen ücretsizdir. 24 saat içinde geri dönüş sağlanır.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
