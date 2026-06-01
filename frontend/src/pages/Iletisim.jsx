import { useState } from 'react'
import { Phone, Mail, MapPin, Send, Clock } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const services = [
  'Akıllı Tarımsal Sulama GES',
  'Arazi Tipi GES',
  'Çatı Tipi GES',
  'Bağ Evi Depolamalı GES',
  'Elektrikli Araç Şarj İstasyonu',
  'Diğer',
]

export default function Iletisim() {
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
    <>
      <PageHeader title="İletişim" />

      {/* Main section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-[#448834] font-semibold text-sm mb-3">İLETİŞİM</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Bize Ulaşın</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Projeleriniz ve detaylı bilgi için iletişim kanallarımızdan bize ulaşabilirsiniz.
            </p>
          </div>

          {/* Two columns */}
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">

            {/* Left — contact cards */}
            <div className="flex flex-col gap-4 h-full">

              <a href="https://maps.google.com/?q=Kurtuluş,+İnkılap+Sk.+no:4+D:J,+45500+Soma/Manisa"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all group flex-1 border-b-4 border-b-[#f5ce31]"
              >
                <div className="flex items-center justify-center shrink-0">
                  <MapPin size={24} className="text-[#448834]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Adres</p>
                  <p className="font-semibold text-gray-800 text-base">Kurtuluş, İnkılap Sk. no:4 D:J</p>
                  <p className="text-gray-500 text-sm mt-1">45500 Soma / Manisa</p>
                </div>
              </a>

              <a href="tel:+905543796004"
                className="flex items-center gap-4 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all group flex-1 border-b-4 border-b-[#448834]"
              >
                <div className="flex items-center justify-center shrink-0">
                  <Phone size={24} className="text-[#448834]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Telefon</p>
                  <p className="font-semibold text-gray-800 text-base">+90 554 379 60 04</p>
                </div>
              </a>

              <a href="mailto:mertcan.yilmaz@renelenerji.com"
                className="flex items-center gap-4 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all group flex-1 border-b-4 border-b-[#f5ce31]"
              >
                <div className="flex items-center justify-center shrink-0">
                  <Mail size={24} className="text-[#448834]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">E-posta</p>
                  <p className="font-semibold text-gray-800 text-base">mertcan.yilmaz@renelenerji.com</p>
                </div>
              </a>

              <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-7 flex-1 border-b-4 border-b-[#448834]">
                <div className="flex items-center justify-center shrink-0">
                  <Clock size={24} className="text-[#448834]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Çalışma Saatleri</p>
                  <p className="font-semibold text-gray-800 text-base">Pzt – Cmt: 08:00 – 18:00</p>
                  <p className="text-gray-500 text-sm mt-1">Pazar: Randevuya göre</p>
                </div>
              </div>

              {/* Social */}
              <div className="flex gap-3 mt-auto">
                <a href="https://wa.me/905543796004?text=Merhaba,%20güneş%20enerjisi%20hakkında%20bilgi%20almak%20istiyorum."
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.845L.057 23.454a.75.75 0 00.918.919l5.702-1.44A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0m0 21.9a9.865 9.865 0 01-5.031-1.376l-.36-.214-3.733.943.991-3.627-.235-.374A9.862 9.862 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1S21.9 6.533 21.9 12 17.467 21.9 12 21.9"/>
                  </svg>
                  WhatsApp
                </a>
                <a href="https://www.instagram.com/renelenerjimuhendislik/"
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90 text-sm"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  Instagram
                </a>
                <a href="https://www.facebook.com/p/RenEl-Enerji-M%C3%BChendislik-61578891790441/"
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
              </div>
            </div>

            {/* Right — form */}
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-7 space-y-4 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Mesaj Gönderin</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ad Soyad *</label>
                  <input
                    required type="text" placeholder="Adınız Soyadınız"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefon *</label>
                  <input
                    required type="tel" placeholder="05XX XXX XX XX"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">İlgilendiğiniz Hizmet *</label>
                <select
                  required value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all text-gray-700"
                >
                  <option value="">Seçiniz...</option>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mesajınız</label>
                <textarea
                  rows={4} placeholder="Projeniz hakkında kısaca bilgi verin..."
                  value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#448834] focus:ring-2 focus:ring-[#448834]/15 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#448834] hover:bg-[#357228] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#448834]/20"
              >
                {sent ? 'Gönderildi! En kısa sürede aranacaksınız.' : (
                  <>
                    <Send size={17} />
                    Gönder
                  </>
                )}
              </button>

              <p className="text-center text-gray-400 text-xs">Formu doldurduktan sonra en kısa sürede size dönüş yapılacaktır.</p>
            </form>
          </div>
        </div>
      </section>

      {/* Full-width map */}
      <div className="h-[420px] w-full">
        <iframe
          title="RenEl Enerji Konumu"
          src="https://maps.google.com/maps?q=Renel+Enerji+M%C3%BChendislik&output=embed&hl=tr"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </>
  )
}
