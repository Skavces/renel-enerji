import { useState } from 'react'
import { Phone, Mail, MapPin, Send, Clock } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SEO from '../components/SEO'

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
      <SEO
        title="İletişim"
        description="RenEL Enerji Mühendislik ile iletişime geçin. Güneş enerjisi sistemi teklifi, proje danışmanlığı ve kurulum için Soma/Manisa ofisimizi arayın veya yazın."
      />
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
      <div className="h-[260px] sm:h-[360px] lg:h-[420px] w-full">
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
