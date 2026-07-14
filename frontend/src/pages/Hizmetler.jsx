import { Link } from 'react-router-dom'
import { Droplets, Home, Battery, Car, Wrench, Zap, ClipboardList, FileBarChart, ArrowRight, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SEO from '../components/SEO'
import { waLink } from '../lib/whatsapp'

const categories = [
  {
    id: 'ges',
    label: 'GES Kurulum Hizmetleri',
    services: [
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
        photo: '/tarimsal-sulama-sistemleri-gunes-enerjisi.webp',
        waMessage: 'Merhaba, tarımsal sulama GES sistemi hakkında teklif almak istiyorum. Arazim için güneş enerjili sulama sistemi kurulumu hakkında bilgi verir misiniz?',
      },
      {
        icon: Home,
        title: 'Arazi & Çatı Tipi GES',
        slug: 'cati-arazi',
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
        photo: '/arazi-cati-tipi-ges.webp',
        highlight: true,
        waMessage: 'Merhaba, arazi/çatı tipi GES kurulumu için teklif almak istiyorum. Kurulum yeri ve kapasite hakkında bilgi almak istiyorum.',
      },
      {
        icon: Battery,
        title: 'Bağ Evi Depolamalı GES',
        slug: 'bag-evi',
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
        photo: '/bag-evi-ges.webp',
        waMessage: 'Merhaba, bağ evi / off-grid GES sistemi için teklif almak istiyorum. Bataryalı güneş enerjisi sistemi hakkında bilgi alabilir miyim?',
      },
      {
        icon: Car,
        title: 'Elektrikli Araç Şarj İstasyonu',
        slug: 'ev-sarj',
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
        photo: '/elektrikli-arac-sarj-istasyonu.webp',
        waMessage: 'Merhaba, elektrikli araç şarj istasyonu kurulumu için teklif almak istiyorum. Güneş enerjili EV şarj sistemi hakkında bilgi alabilir miyim?',
      },
    ],
  },
  {
    id: 'bakim',
    label: 'Bakım & Onarım',
    services: [
      {
        icon: Wrench,
        title: 'GES Bakım & Onarım',
        slug: 'ges-bakim-onarim',
        description:
          'Güneş enerji santrallerinizin maksimum verimde çalışmaya devam etmesi için düzenli saha takibi, arıza tespiti, onarım ve temizlik hizmetleri sunuyoruz. Erken müdahaleyle büyük kayıpların önüne geçin.',
        features: [
          'Saha takibi ve performans analizi',
          'Arıza tespiti ve onarımı',
          'Panel temizliği',
          'Saha temizliği',
          'Periyodik bakım sözleşmesi',
          'Uzaktan izleme desteği',
        ],
        photo: '/ges-bakim-onarim.webp',
        waMessage: 'Merhaba, GES bakım ve onarım hizmeti hakkında bilgi almak istiyorum. Sistemim için periyodik bakım teklifi alabilir miyim?',
      },
      {
        icon: Zap,
        title: 'Elektrik Altyapı Bakımı',
        slug: 'elektrik-altyapi-bakimi',
        description:
          'Trafo, pano ve dağıtım şebekesi bakım onarımıyla elektrik altyapınızın güvenli ve kesintisiz çalışmasını sağlıyoruz. AG ve OG sistemlerde standartlara uygun periyodik bakım ve acil onarım hizmeti.',
        features: [
          'Trafo bakım ve onarımı',
          'AG/OG pano bakım onarımı',
          'Dağıtım şebekesi kontrolü',
          'Periyodik test ve ölçümler',
          'Arıza tespiti ve onarımı',
          'Standartlara uygun mühendislik hizmeti',
        ],
        photo: '/elektrik-altyapi-bakimi.webp',
        waMessage: 'Merhaba, trafo, pano ve elektrik altyapısı bakım onarım hizmeti hakkında bilgi almak istiyorum.',
      },
    ],
  },
  {
    id: 'danismanlik',
    label: 'Danışmanlık',
    services: [
      {
        icon: ClipboardList,
        title: 'Proje Danışmanlığı',
        slug: 'proje-danismanlik',
        description:
          'GES yatırımına karar vermeden önce doğru kararı vermeniz için fizibilite analizi, yıllık üretim tahmini ve yatırım geri dönüş hesabı yapıyoruz. Teşvik mekanizmaları ve lisanssız üretim mevzuatı konularında da rehberlik ediyoruz.',
        features: [
          'Fizibilite analizi ve üretim tahmini',
          'Yatırım geri dönüş hesabı',
          'Proje tasarımı ve mühendislik',
          'Teşvik mekanizmaları danışmanlığı',
          'Lisanssız üretim mevzuatı',
          'Şebeke bağlantı süreci yönetimi',
        ],
        photo: '/proje-danismanlik.webp',
        highlight: true,
        waMessage: 'Merhaba, GES proje danışmanlığı hakkında bilgi almak istiyorum. Fizibilite ve yatırım analizi için görüşme talep ediyorum.',
      },
      {
        icon: FileBarChart,
        title: 'Enerji Danışmanlığı',
        slug: 'enerji-danismanlik',
        description:
          'Elektrik faturalarınızdan reaktif ceza risklerine kadar enerji giderlerinizin her aşamasını takip ediyor, tasarruf fırsatlarını raporluyoruz. Abonelik işlemlerinden perakende satış sözleşmelerine kadar tüm süreçlerde yanınızdayız.',
        features: [
          'Reaktif ceza kontrolü ve reaktif enerji izleme',
          'Elektrik faturalarının kontrolü',
          'Fatura analiz ve raporlama',
          'Elektrik abonelik işlemleri',
          'Perakende satış sözleşmelerinin takibi',
          'Risk analizi, keşif ve saha incelemeleri',
        ],
        photo: '/enerji-danismanlik.webp',
        photoAlt: 'Enerji danışmanı elektrik faturasını ve dizüstü bilgisayarda enerji tüketim grafiğini inceliyor',
        waMessage: 'Merhaba, enerji danışmanlığı hizmetleriniz hakkında bilgi almak istiyorum. Elektrik faturası ve reaktif enerji kontrolü konusunda görüşmek istiyorum.',
      },
    ],
  },
]

const allServices = categories.flatMap((c) => c.services)

const hizmetlerJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Hizmetler | RenEl Enerji Mühendislik',
  url: 'https://renelenerji.com/hizmetler',
  description:
    'Güneş enerjisi hizmetlerimiz: tarımsal sulama GES, çatı ve arazi tipi GES, bağ evi depolamalı GES, elektrikli araç şarj istasyonu, GES bakım onarım, elektrik altyapı bakımı, proje danışmanlığı ve enerji danışmanlığı.',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: allServices.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Service',
        name: s.title,
        description: s.description,
        image: `https://renelenerji.com${s.photo}`,
        url: `https://renelenerji.com/hizmetler/${s.slug}`,
        provider: { '@type': 'Organization', name: 'RenEl Enerji Mühendislik', url: 'https://renelenerji.com' },
        areaServed: { '@type': 'Place', name: 'Soma, Manisa, Türkiye' },
      },
    })),
  },
}

export default function Hizmetler() {
  return (
    <>
      <SEO
        title="GES Kurulum, Bakım & Danışmanlık Hizmetleri | Soma Manisa"
        description="Soma ve Manisa'da güneş enerjisi hizmetleri: tarımsal sulama GES, çatı ve arazi tipi GES, bağ evi depolamalı GES, EV şarj istasyonu, GES bakım onarım, elektrik altyapı bakımı, proje ve enerji danışmanlığı."
        jsonLd={hizmetlerJsonLd}
      />
      <PageHeader title="Hizmetler" />

      {/* Intro bar */}
      <section className="bg-gray-50 border-b border-gray-100 py-12 pt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">Neler Yapıyoruz?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-snug mb-4">
            Güneş Enerjisinde Tam Kapsamlı Çözüm
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Kurulumdan bakıma, danışmanlıktan altyapıya kadar ihtiyacınıza özel mühendislik tasarımı
            ve anahtar teslim hizmet sunuyoruz.
          </p>
        </div>
      </section>

      {/* Service categories */}
      <section className="pt-16 pb-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {categories.map((cat) => (
            <div key={cat.id}>
              {/* Category header */}
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">{cat.label}</h2>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Service cards */}
              <div className="space-y-8">
                {cat.services.map((s, i) => {
                  const Icon = s.icon
                  const isEven = i % 2 === 0
                  return (
                    <div
                      key={s.slug}
                      className={`group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 grid lg:grid-cols-2 ${s.highlight ? 'ring-2 ring-[#448834]/40' : 'border border-gray-100'}`}
                    >
                      {/* Photo side */}
                      <div className={`relative h-72 lg:h-auto min-h-85 overflow-hidden ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                        <img
                          src={s.photo}
                          alt={s.photoAlt ?? s.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-7">
                          <Icon size={24} className="text-white mb-4" />
                          <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{s.title}</h3>
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
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href={waLink(s.waMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-semibold px-6 py-3 rounded-xl transition-colors w-fit text-sm shadow-md shadow-green-900/20"
                          >
                            Teklif Al
                            <ArrowRight size={15} />
                          </a>
                          <Link
                            to={`/hizmetler/${s.slug}`}
                            className="inline-flex items-center gap-1.5 text-[#357228] font-semibold text-sm hover:gap-3 transition-all"
                          >
                            Detaylı İncele
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
