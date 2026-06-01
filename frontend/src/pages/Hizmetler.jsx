import { Droplets, Home, Battery, Car, ArrowRight, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const WA_NUMBER = '905543796004'

function waLink(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}

const services = [
  {
    icon: Droplets,
    title: 'Akıllı Tarımsal Sulama GES',
    slug: 'sulama',
    description:
      'Tarım arazilerinizin sulama ihtiyacını güneş enerjisiyle karşılayın. Elektrik faturanızı sıfıra indirin, verimliliğinizi artırın. Güneş enerjili sulama sistemleri, özellikle Manisa gibi tarımın yoğun olduğu bölgelerde maliyet avantajı ve bağımsız enerji üretimi sağlar.',
    features: [
      'Dalgıç ve yüzey pompa sistemleri entegrasyonu',
      'Otomatik sulama kontrolü ve zamanlayıcı',
      'Uzaktan izleme ve mobil takip',
      'Şebeke bağımsız (off-grid) çalışma',
      'Batarya destekli gece sulama seçeneği',
      'Farklı kapasitelerde sistem tasarımı',
    ],
    color: 'from-blue-500 to-cyan-400',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'Tarımsal Çözüm',
    badgeColor: 'bg-blue-100 text-blue-700',
    photo: '/tarimsal-sulama-sistemleri-gunes-enerjisi.webp',
    waMessage: 'Merhaba, tarımsal sulama GES sistemi hakkında teklif almak istiyorum. Arazim için güneş enerjili sulama sistemi kurulumu hakkında bilgi verir misiniz?',
  },
  {
    icon: Home,
    slug: 'cati-arazi',
    title: 'Arazi & Çatı Tipi GES',
    description:
      'Evinizin çatısına veya arazinize kurulacak güneş enerji sistemi ile hem kendi elektriğinizi üretin hem de fazlasını şebekeye satın. Konuttan ticarete, küçük kurulumdan büyük kapasiteye kadar tüm ölçeklerde mühendislik çözümü sunuyoruz.',
    features: [
      'Konut, tarımsal yapı ve ticari çatılar',
      'Büyük kapasiteli arazi kurulumları',
      'Şebeke entegrasyonu ve sayaç anlaşması',
      'Yıllık verim simülasyonu ve fizibilite',
      'TC lisanslı elektrik projesi',
      'Montaj sonrası garanti ve bakım',
    ],
    color: 'from-orange-500 to-amber-400',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    photo: '/arazi-cati-tipi-ges.webp',
    highlight: true,
    waMessage: 'Merhaba, arazi/çatı tipi GES kurulumu için teklif almak istiyorum. Kurulum yeri ve kapasite hakkında bilgi almak istiyorum.',
  },
  {
    icon: Battery,
    slug: 'bag-evi',
    title: 'Bağ Evi Depolamalı GES',
    description:
      'Şebekenin olmadığı veya kesintili olduğu bağ evleri, tarla evleri ve yazlık konutlar için batarya destekli güneş sistemi çözümleri. Güneş olmadığında depolanan enerjiden yararlanın, tamamen bağımsız olun.',
    features: [
      'Lityum (LiFePO4) batarya depolama',
      'Tam off-grid ve hibrit seçenekler',
      '7/24 kesintisiz enerji güvencesi',
      'Akıllı BMS (batarya yönetim sistemi)',
      'Şebeke olmayan noktalara özel tasarım',
      'Uzun ömürlü ve düşük bakım maliyeti',
    ],
    color: 'from-green-500 to-emerald-400',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badge: 'Off-Grid',
    badgeColor: 'bg-green-100 text-green-700',
    photo: '/bag-evi-ges.webp',
    waMessage: 'Merhaba, bağ evi / off-grid GES sistemi için teklif almak istiyorum. Bataryalı güneş enerjisi sistemi hakkında bilgi alabilir miyim?',
  },
  {
    icon: Car,
    slug: 'ev-sarj',
    title: 'Elektrikli Araç Şarj İstasyonu',
    description:
      'Güneş enerjisi destekli EV şarj istasyonu kurulumu ile elektrikli araçlarınızı tamamen yenilenebilir enerjiyle şarj edin. Konut garajından ticari otoparka kadar her ölçekte çözüm.',
    features: [
      'AC (7-22 kW) ve DC hızlı şarj seçenekleri',
      'Güneş paneli + şebeke hibrit entegrasyonu',
      'Akıllı yük yönetimi ve zamanlama',
      'Tek veya çok noktalı şarj istasyonu',
      'OCPP protokolü destekli akıllı şarj',
      'Kurulum, sertifika ve devreye alma',
    ],
    color: 'from-purple-500 to-violet-400',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badge: 'E-Mobilite',
    badgeColor: 'bg-purple-100 text-purple-700',
    photo: '/elektrikli-arac-sarj-istasyonu.webp',
    waMessage: 'Merhaba, elektrikli araç şarj istasyonu kurulumu için teklif almak istiyorum. Güneş enerjili EV şarj sistemi hakkında bilgi alabilir miyim?',
  },
]

export default function Hizmetler() {
  return (
    <>
      <PageHeader title="Hizmetler" />

      {/* Intro bar */}
      <section className="bg-gray-50 border-b border-gray-100 py-12 pt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">Neler Yapıyoruz?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-snug mb-4">
            Güneş Enerjisinde Tam Kapsamlı Çözüm
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Tarımsal sulamadan off-grid sistemlere, EV şarjdan çatı tipi GES'e kadar
            ihtiyacınıza özel mühendislik tasarımı ve anahtar teslim kurulum hizmeti sunuyoruz.
          </p>
        </div>
      </section>

      {/* Service cards */}
      <section className="pt-16 pb-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {services.map((s, i) => {
            const Icon = s.icon
            const isEven = i % 2 === 0
            return (
              <div
                key={s.slug}
                className={`group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 grid lg:grid-cols-2 ${s.highlight ? 'ring-2 ring-[#448834]/40' : 'border border-gray-100'}`}
              >
                {/* Photo side */}
                <div className={`relative h-72 lg:h-auto min-h-[340px] overflow-hidden ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <img
                    src={s.photo}
                    alt={s.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Icon + title */}
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    <Icon size={24} className="text-white mb-4" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{s.title}</h2>
                  </div>
                </div>

                {/* Content side */}
                <div className={`p-8 lg:p-10 flex flex-col justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  <p className="text-gray-600 leading-relaxed mb-7 text-[0.95rem]">{s.description}</p>
                  <ul className="space-y-2.5 mb-8">
                    {s.features.map(f => (
                      <li key={f} className="flex items-start gap-3">
                        <CheckCircle size={16} className="text-[#448834] shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waLink(s.waMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold px-6 py-3 rounded-xl transition-colors w-fit text-sm shadow-md shadow-green-900/20"
                  >
                    Teklif Al
                    <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

    </>
  )
}
