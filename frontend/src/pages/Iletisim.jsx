import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SEO from '../components/SEO'
import { WA_NUMBER, waLink } from '../lib/whatsapp'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'RenEL Enerji Mühendislik',
  url: 'https://renelenerji.com',
  telephone: '+90-554-379-60-04',
  email: 'mertcan.yilmaz@renelenerji.com',
  image: 'https://renelenerji.com/og-image.webp',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kurtuluş, İnkılap Sk. no:4 D:J',
    addressLocality: 'Soma',
    addressRegion: 'Manisa',
    postalCode: '45500',
    addressCountry: 'TR',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 39.188, longitude: 27.613 },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '08:00', closes: '18:00' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+90-554-379-60-04',
    contactType: 'customer service',
    availableLanguage: 'Turkish',
  },
}

export default function Iletisim() {
  return (
    <>
      <SEO
        title="Soma GES Teklif Al"
        description="Soma ve Manisa'da güneş enerjisi sistemi teklifi alın. Tarımsal sulama GES, çatı tipi GES ve EV şarj istasyonu kurulumu için RenEL Enerji Mühendislik ile iletişime geçin."
        jsonLd={jsonLd}
      />
      <PageHeader title="İletişim" />

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">

          <div className="text-center mb-12">
            <p className="text-[#448834] font-semibold text-sm mb-3">İLETİŞİM</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Bize Ulaşın</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">
              Projeleriniz ve detaylı bilgi için aşağıdaki kanallardan bize ulaşabilirsiniz.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <a
              href="https://maps.google.com/?q=Kurtuluş,+İnkılap+Sk.+no:4+D:J,+45500+Soma/Manisa"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-5 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all border-b-4 border-b-[#f5ce31]"
            >
              <MapPin size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Adres</p>
                <p className="font-semibold text-gray-800">Kurtuluş, İnkılap Sk. no:4 D:J</p>
                <p className="text-gray-500 text-sm mt-0.5">45500 Soma / Manisa</p>
              </div>
            </a>

            <a
              href={`tel:+${WA_NUMBER}`}
              className="flex items-center gap-5 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all border-b-4 border-b-[#448834]"
            >
              <Phone size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Telefon</p>
                <p className="font-semibold text-gray-800">+90 554 379 60 04</p>
              </div>
            </a>

            <a
              href="mailto:mertcan.yilmaz@renelenerji.com"
              className="flex items-center gap-5 bg-white border border-gray-200 hover:border-[#448834]/40 rounded-2xl p-7 transition-all border-b-4 border-b-[#f5ce31]"
            >
              <Mail size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">E-posta</p>
                <p className="font-semibold text-gray-800">mertcan.yilmaz@renelenerji.com</p>
              </div>
            </a>

            <div className="flex items-center gap-5 bg-white border border-gray-200 rounded-2xl p-7 border-b-4 border-b-[#448834]">
              <Clock size={26} className="text-[#448834] shrink-0" />
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Çalışma Saatleri</p>
                <p className="font-semibold text-gray-800">Pzt – Cmt: 08:00 – 18:00</p>
                <p className="text-gray-500 text-sm mt-0.5">Pazar: Randevuya göre</p>
              </div>
            </div>
          </div>

          <a
            href={waLink('Merhaba, güneş enerjisi sistemi hakkında bilgi almak istiyorum.')}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-4 rounded-2xl transition-colors shadow-md shadow-[#25D366]/20 text-base"
          >
            <MessageCircle size={22} />
            WhatsApp ile Teklif Al
          </a>
        </div>
      </section>

      <section className="pb-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm h-[260px] sm:h-[360px] lg:h-[420px]">
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
        </div>
      </section>
    </>
  )
}
