import { Link } from 'react-router-dom'
import { Droplets, Home, Battery, Car, ArrowRight } from 'lucide-react'
import { waLink } from '../lib/whatsapp'

const services = [
  {
    icon: Droplets,
    title: 'Akıllı Tarımsal Sulama GES',
    slug: 'sulama',
    description: 'Tarım arazilerinizin sulama ihtiyacını güneş enerjisiyle karşılayın. Elektrik faturanızı sıfıra indirin, verimliliğinizi artırın.',
    features: ['Pompa sistemleri entegrasyonu', 'Otomatik sulama kontrolü', 'Uzaktan izleme'],
    color: 'from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    photo: '/tarimsal-sulama-sistemleri-gunes-enerjisi.webp',
    ring: 'ring-2 ring-[#448834]/30',
    waMessage: 'Merhaba, tarımsal sulama GES sistemi hakkında teklif almak istiyorum. Arazim için güneş enerjili sulama sistemi kurulumu hakkında bilgi verir misiniz?',
  },
  {
    icon: Home,
    title: 'Arazi & Çatı Tipi GES',
    slug: 'cati-arazi',
    description: 'Evinizin çatısına veya arazinize kurulacak güneş enerji sistemi ile elektrik üretin, şebekeye satın ya da kendi tüketiminizde kullanın.',
    features: ['Konut & ticari çatılar', 'Arazi tipi büyük kurulumlar', 'Şebeke entegrasyonu'],
    color: 'from-[#448834] to-[#6ab84e]',
    iconBg: 'bg-[#448834]/15',
    iconColor: 'text-[#448834]',
    photo: '/arazi-cati-tipi-ges.webp',
    highlight: true,
    waMessage: 'Merhaba, arazi/çatı tipi GES kurulumu için teklif almak istiyorum. Kurulum yeri ve kapasite hakkında bilgi almak istiyorum.',
  },
  {
    icon: Battery,
    title: 'Bağ Evi Depolamalı GES',
    slug: 'bag-evi',
    description: 'Şebekenin olmadığı veya kesintili olduğu bağ evleri için batarya destekli off-grid ya da hibrit güneş sistemi çözümleri.',
    features: ['Lityum batarya depolama', 'Hibrit & off-grid seçenekler', '7/24 enerji güvencesi'],
    color: 'from-amber-500 to-yellow-400',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    photo: '/bag-evi-ges.webp',
    ring: 'ring-2 ring-[#448834]/30',
    waMessage: 'Merhaba, bağ evi / off-grid GES sistemi için teklif almak istiyorum. Bataryalı güneş enerjisi sistemi hakkında bilgi alabilir miyim?',
  },
  {
    icon: Car,
    title: 'Elektrikli Araç Şarj İstasyonu',
    slug: 'ev-sarj',
    description: 'Güneş enerjisi destekli EV şarj istasyonu kurulumu ile araçlarınızı güneşten üretilen temiz enerji ile şarj edin.',
    features: ['AC & DC hızlı şarj', 'Güneş + şebeke entegrasyonu', 'Akıllı yük yönetimi'],
    color: 'from-purple-500 to-violet-400',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    photo: '/elektrikli-arac-sarj-istasyonu.webp',
    ring: 'ring-2 ring-[#448834]/30',
    waMessage: 'Merhaba, elektrikli araç şarj istasyonu kurulumu için teklif almak istiyorum. Güneş enerjili EV şarj sistemi hakkında bilgi alabilir miyim?',
  },
]

export default function Services() {
  return (
    <section id="hizmetler" className="relative py-24 bg-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute left-0 bottom-0 w-[750px] h-[750px] pointer-events-none select-none opacity-70">
        <img src="/banner.webp" alt="" className="w-full h-full object-contain object-bottom-left" loading="lazy" />
      </div>
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-[#357228] font-semibold text-base mb-4">
            HİZMETLERİMİZ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Güneş Enerjisinde Tam Kapsamlı Çözümler
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Tarımdan konuta, depolamadan e-mobiliteye kadar güneş enerjisinin gücünü her alana taşıyoruz.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className={`relative rounded-2xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group ${s.highlight ? 'ring-2 ring-[#448834]/30' : s.ring || ''}`}
              >
                {/* Photo */}
                <Link to={`/hizmetler/${s.slug}`} className="block h-36 overflow-hidden">
                  <img
                    src={s.photo}
                    alt={s.title}
                    className="w-full h-full object-cover" loading="lazy" />
                </Link>

                <div className="p-5 flex flex-col gap-3 flex-1 bg-white">
                  <Link to={`/hizmetler/${s.slug}`} className="contents">
                    <div className="flex items-center gap-3">
                      <Icon className="text-[#448834]" size={22} />
                      <div className="h-0.5 flex-1 rounded-full bg-[#448834]/30" />
                    </div>

                    <h3 className="font-bold text-gray-900 text-base leading-tight">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed flex-1">{s.description}</p>

                    <ul className="space-y-1.5">
                      {s.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#448834] shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </Link>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Link
                      to={`/hizmetler/${s.slug}`}
                      className="text-sm font-semibold text-gray-500 hover:text-[#448834] transition-colors"
                    >
                      Detaylı Bilgi
                    </Link>
                    <a
                      href={waLink(s.waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.title} için teklif al`}
                      className="inline-flex items-center gap-1.5 text-[#357228] font-semibold text-sm group-hover:gap-3 transition-all"
                    >
                      Teklif Al
                      <ArrowRight size={15} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
