import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, Home, Battery, Car, Wrench, Zap, ClipboardList, FileBarChart, ArrowRight } from 'lucide-react'
import { waLink } from '../lib/whatsapp'

const categories = [
  {
    id: 'ges',
    label: 'GES Kurulum Hizmetleri',
    labelShort: 'GES Kurulum',
    description:
      'Tarımsal sulamadan konut ve ticari çatılara, off-grid bağ evlerinden elektrikli araç şarj altyapısına kadar güneş enerjisi kurulumunda uçtan uca hizmet sunuyoruz. Sahada yapılan keşiften sistemi devreye almaya kadar tüm süreci yönetiyoruz.',
    services: [
      {
        icon: Droplets,
        title: 'Akıllı Tarımsal Sulama GES',
        slug: 'sulama',
        description: 'Tarım arazilerinizin sulama ihtiyacını güneş enerjisiyle karşılayın. Elektrik faturanızı sıfıra indirin, verimliliğinizi artırın.',
        features: ['Pompa sistemleri entegrasyonu', 'Otomatik sulama kontrolü', 'Uzaktan izleme'],
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
        photo: '/elektrikli-arac-sarj-istasyonu.webp',
        ring: 'ring-2 ring-[#448834]/30',
        waMessage: 'Merhaba, elektrikli araç şarj istasyonu kurulumu için teklif almak istiyorum. Güneş enerjili EV şarj sistemi hakkında bilgi alabilir miyim?',
      },
    ],
  },
  {
    id: 'bakim',
    label: 'Bakım & Onarım',
    labelShort: 'Bakım & Onarım',
    description:
      'Kurulu GES sistemlerinizin verim kaybı yaşamaması için düzenli saha takibi, arıza tespiti ve onarım hizmetleri sunuyoruz. Panel temizliğinden trafo ve pano bakımına, AG/OG dağıtım şebekesi onarımına kadar eksiksiz bir bakım hizmeti sağlıyoruz.',
    services: [
      {
        icon: Wrench,
        title: 'GES Bakım & Onarım',
        slug: 'ges-bakim-onarim',
        description: 'Güneş enerji santrallerinizin maksimum verimde çalışması için periyodik bakım, arıza tespiti, onarım ve temizlik hizmetleri.',
        features: ['Saha takibi & performans analizi', 'Arıza tespiti ve onarımı', 'GES & saha temizliği'],
        photo: '/ges-bakim-onarim.webp',
        ring: 'ring-2 ring-[#448834]/30',
        waMessage: 'Merhaba, GES bakım ve onarım hizmeti hakkında bilgi almak istiyorum. Sistemim için periyodik bakım teklifi alabilir miyim?',
      },
      {
        icon: Zap,
        title: 'Elektrik Altyapı Bakımı',
        slug: 'elektrik-altyapi-bakimi',
        description: 'Trafo, pano ve dağıtım şebekesi bakım onarımı ile elektrik altyapınızın güvenli ve kesintisiz çalışmasını sağlıyoruz.',
        features: ['Trafo & pano bakım onarım', 'AG/OG dağıtım şebekesi', 'Periyodik kontrol & test'],
        photo: '/elektrik-altyapi-bakimi.webp',
        ring: 'ring-2 ring-[#448834]/30',
        waMessage: 'Merhaba, trafo, pano ve elektrik altyapısı bakım onarım hizmeti hakkında bilgi almak istiyorum.',
      },
    ],
  },
  {
    id: 'danismanlik',
    label: 'Danışmanlık',
    labelShort: 'Danışmanlık',
    description:
      'GES yatırımına karar vermeden önce doğru kararı vermeniz için fizibilite analizi, proje tasarımı ve yatırım geri dönüş hesabı yapıyoruz. Teşvik mekanizmaları ve lisanssız üretim mevzuatı konularında da rehberlik ediyoruz.',
    services: [
      {
        icon: ClipboardList,
        title: 'Proje Danışmanlığı',
        slug: 'proje-danismanlik',
        description: 'GES yatırımınızı doğru planlamak için fizibilite, mühendislik tasarımı ve mevzuat danışmanlığı hizmetleri sunuyoruz.',
        features: ['Fizibilite & yatırım analizi', 'Proje tasarımı & mühendislik', 'Teşvik & lisans danışmanlığı'],
        photo: '/proje-danismanlik.webp',
        highlight: true,
        waMessage: 'Merhaba, GES proje danışmanlığı hakkında bilgi almak istiyorum. Fizibilite ve yatırım analizi için görüşme talep ediyorum.',
      },
      {
        icon: FileBarChart,
        title: 'Enerji Danışmanlığı',
        slug: 'enerji-danismanlik',
        description: 'Elektrik faturalarınızı ve reaktif enerji tüketiminizi takip ediyor, ceza risklerine karşı sizi koruyoruz.',
        features: ['Reaktif ceza & enerji izleme', 'Fatura analiz & raporlama', 'Abonelik & sözleşme takibi'],
        photo: '/enerji-danismanlik.webp',
        photoAlt: 'Enerji danışmanı elektrik faturasını ve dizüstü bilgisayarda enerji tüketim grafiğini inceliyor',
        ring: 'ring-2 ring-[#448834]/30',
        waMessage: 'Merhaba, enerji danışmanlığı hizmetleriniz hakkında bilgi almak istiyorum. Elektrik faturası ve reaktif enerji kontrolü konusunda görüşmek istiyorum.',
      },
    ],
  },
]

export default function Services() {
  const [activeTab, setActiveTab] = useState('ges')

  return (
    <section id="hizmetler" className="relative py-24 bg-white overflow-hidden">
      {/* Decorative background */}
      <div className="absolute left-0 bottom-0 w-187.5 h-187.5 pointer-events-none select-none opacity-70">
        <img src="/banner.webp" alt="" className="w-full h-full object-contain object-bottom-left" loading="lazy" />
      </div>

      <div className="max-w-350 mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-[#357228] font-semibold text-base mb-4">
            HİZMETLERİMİZ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Güneş Enerjisinde Tam Kapsamlı Çözümler
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Kurulumdan bakıma, danışmanlıktan altyapıya kadar güneş enerjisinin gücünü her alana taşıyoruz.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === cat.id
                  ? 'bg-[#448834] text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="sm:hidden">{cat.labelShort}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* All category content in DOM for SEO */}
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={activeTab === cat.id ? 'block' : 'hidden'}
            aria-hidden={activeTab !== cat.id}
          >
            {/* Cards */}
            <div className={`grid gap-6 ${
              cat.services.length === 1
                ? 'max-w-md mx-auto'
                : cat.services.length === 2
                ? 'sm:grid-cols-2 max-w-2xl mx-auto'
                : 'sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {cat.services.map((s) => {
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
                        alt={s.photoAlt ?? s.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
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
                          aria-label={`${s.title} hakkında detaylı bilgi`}
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

            {/* SEO description */}
            <p className="mt-8 text-center text-gray-500 text-sm leading-relaxed max-w-3xl mx-auto">
              {cat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
