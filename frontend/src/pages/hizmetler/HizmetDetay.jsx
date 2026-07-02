import { useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Droplets, Home, Battery, Car, Wrench, Zap, ClipboardList, FileBarChart, CheckCircle, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SEO from '../../components/SEO'
import { waLink } from '../../lib/whatsapp'

const services = [
  {
    slug: 'sulama',
    icon: Droplets,
    title: 'Akıllı Tarımsal Sulama GES',
    photo: '/tarimsal-sulama-sistemleri-gunes-enerjisi.webp',
    subtitle: 'Tarım arazinizin sulama ihtiyacını güneş enerjisiyle karşılayın, elektrik faturanızı sıfırlayın.',
    description:
      'Tarımsal sulamada en büyük gider kalemlerinden biri elektrik veya dizel pompa maliyetidir. RenEl olarak kurduğumuz güneş enerjili sulama sistemleri, dalgıç ve yüzey pompalarını doğrudan güneşten beslerken otomatik sulama kontrolü ile arazinizin verimini artırır. Özellikle Soma ve Manisa gibi tarımın yoğun olduğu bölgelerde bu sistemler kısa sürede kendini amorti eder.',
    description2:
      'Şebekenin olmadığı veya kesintili olduğu arazilerde tamamen off-grid çalışabilen sistemlerimiz, isteğe bağlı batarya desteğiyle gece sulamasına da imkân tanır. Tüm sistemler arazinizin büyüklüğüne ve su ihtiyacına göre özel olarak boyutlandırılır.',
    features: [
      'Dalgıç ve yüzey pompa sistemleri entegrasyonu',
      'Otomatik sulama kontrolü ve zamanlayıcı',
      'Uzaktan izleme ve mobil takip',
      'Şebeke bağımsız (off-grid) çalışma',
      'Batarya destekli gece sulama seçeneği',
      'Arazi büyüklüğüne özel sistem tasarımı',
    ],
    waMessage: 'Merhaba, tarımsal sulama GES sistemi hakkında teklif almak istiyorum. Arazim için güneş enerjili sulama sistemi kurulumu hakkında bilgi verir misiniz?',
  },
  {
    slug: 'cati-arazi',
    icon: Home,
    title: 'Arazi & Çatı Tipi GES',
    photo: '/arazi-cati-tipi-ges.webp',
    subtitle: 'Çatınıza veya arazinize kuracağımız sistemle kendi elektriğinizi üretin, fazlasını şebekeye satın.',
    description:
      'Konut çatılarından ticari işletmelere, küçük kurulumlardan büyük kapasiteli arazi tipi santrallere kadar her ölçekte güneş enerjisi sistemi kuruyoruz. Üretilen enerjiyi kendi tüketiminizde kullanabilir, ihtiyaç fazlasını şebekeye satarak yatırımınızı daha hızlı geri kazanabilirsiniz.',
    description2:
      'Kurulum öncesinde yapılan yıllık verim simülasyonu ve fizibilite çalışmasıyla beklenen üretim ve geri dönüş süresi netleştirilir; TC lisanslı elektrik projesi ve şebeke bağlantı işlemleri tarafımızca yürütülür.',
    features: [
      'Konut, tarımsal yapı ve ticari çatılar',
      'Büyük kapasiteli arazi tipi kurulumlar',
      'Şebeke entegrasyonu ve sayaç anlaşması',
      'Yıllık verim simülasyonu ve fizibilite raporu',
      'TC lisanslı elektrik mühendislik projesi',
      'Montaj sonrası garanti ve bakım desteği',
    ],
    waMessage: 'Merhaba, arazi/çatı tipi GES kurulumu için teklif almak istiyorum. Kurulum yeri ve kapasite hakkında bilgi almak istiyorum.',
  },
  {
    slug: 'bag-evi',
    icon: Battery,
    title: 'Bağ Evi Depolamalı GES',
    photo: '/bag-evi-ges.webp',
    subtitle: 'Şebekenin olmadığı bağ evleri ve tarla evleri için batarya destekli, tamamen bağımsız enerji çözümü.',
    description:
      'Şebekenin ulaşmadığı ya da sık sık kesildiği bağ evleri, tarla evleri ve yazlık konutlar için lityum (LiFePO4) batarya destekli off-grid ve hibrit güneş enerjisi sistemleri kuruyoruz. Güneşin olmadığı saatlerde depolanan enerjiyle kesintisiz elektrik kullanmaya devam edersiniz.',
    description2:
      'Akıllı batarya yönetim sistemi (BMS) ile sisteminiz sürekli izlenir, enerji kullanımı optimize edilir. Düşük bakım maliyeti ve uzun ömürlü bataryalarla yıllarca güvenle kullanabileceğiniz bir yatırım sunuyoruz.',
    features: [
      'Lityum (LiFePO4) batarya depolama',
      'Tam off-grid ve hibrit sistem seçenekleri',
      '7/24 kesintisiz enerji güvencesi',
      'Akıllı BMS (batarya yönetim sistemi)',
      'Şebekesiz bölgelere özel sistem tasarımı',
      'Uzun ömürlü, düşük bakım maliyeti',
    ],
    waMessage: 'Merhaba, bağ evi / off-grid GES sistemi için teklif almak istiyorum. Bataryalı güneş enerjisi sistemi hakkında bilgi alabilir miyim?',
  },
  {
    slug: 'ev-sarj',
    icon: Car,
    title: 'Elektrikli Araç Şarj İstasyonu',
    photo: '/elektrikli-arac-sarj-istasyonu.webp',
    subtitle: 'Güneş enerjisi destekli EV şarj istasyonuyla aracınızı temiz enerjiyle, akıllıca şarj edin.',
    description:
      'Elektrikli araç sahiplerinin artan ihtiyacına yönelik olarak, güneş paneli ve şebeke entegrasyonu ile çalışan akıllı şarj istasyonları kuruyoruz. Konut garajından ticari otoparka kadar her ölçekte, AC ve DC hızlı şarj seçenekleriyle ihtiyacınıza uygun çözümü tasarlıyoruz.',
    description2:
      'OCPP protokolü destekli akıllı yük yönetimi sayesinde şarj süreleri ve maliyetleri optimize edilir; tek istasyondan çok noktalı kurulumlara kadar ölçeklenebilir sistemler sunuyoruz.',
    features: [
      'AC (7-22 kW) ve DC hızlı şarj seçenekleri',
      'Güneş paneli + şebeke hibrit entegrasyonu',
      'Akıllı yük yönetimi ve zamanlama',
      'Tek veya çok noktalı şarj istasyonu kurulumu',
      'OCPP protokolü destekli akıllı şarj altyapısı',
      'Kurulum, sertifikasyon ve devreye alma',
    ],
    waMessage: 'Merhaba, elektrikli araç şarj istasyonu kurulumu için teklif almak istiyorum. Güneş enerjili EV şarj sistemi hakkında bilgi alabilir miyim?',
  },
  {
    slug: 'ges-bakim-onarim',
    icon: Wrench,
    title: 'GES Bakım & Onarım',
    photoAlt: 'Güneş paneli bakım onarım - teknisyen panel temizliği ve saha takibi yapıyor',
    photo: '/ges-bakim-onarim.webp',
    subtitle: 'GES sisteminizin maksimum verimde çalışması için periyodik bakım, arıza tespiti ve temizlik hizmetleri.',
    description:
      'Güneş enerji santrallerinizin yıllar içinde verim kaybı yaşamadan çalışmaya devam etmesi için düzenli bakım ve takip şarttır. RenEl olarak kurulu sistemlerin saha takibini yapıyor, arıza tespiti ve onarımını üstleniyor, panel ve saha temizliğini gerçekleştiriyoruz.',
    description2:
      'Periyodik bakım sözleşmelerimiz kapsamında sisteminiz düzenli aralıklarla kontrol edilir, verim düşüklükleri tespit edilip giderilir. Erken müdahale ile büyük arızaların önüne geçilir, yatırımınızın ömrü uzatılır.',
    features: [
      'Saha takibi ve performans analizi',
      'Arıza tespiti ve onarımı',
      'Panel temizliği',
      'Saha temizliği',
      'Periyodik bakım sözleşmesi',
      'Uzaktan izleme desteği',
    ],
    waMessage: 'Merhaba, GES bakım ve onarım hizmeti hakkında bilgi almak istiyorum. Sistemim için periyodik bakım teklifi alabilir miyim?',
  },
  {
    slug: 'elektrik-altyapi-bakimi',
    icon: Zap,
    title: 'Elektrik Altyapı Bakımı',
    photoAlt: 'Elektrik altyapı bakımı - trafo ve AG/OG pano bakım onarım',
    photo: '/elektrik-altyapi-bakimi.webp',
    subtitle: 'Trafo, pano ve dağıtım şebekesi bakım onarımıyla elektrik altyapınızın güvenli ve kesintisiz çalışmasını sağlıyoruz.',
    description:
      'Elektrik altyapısının güvenli ve verimli çalışması için trafo, AG/OG panoları ve dağıtım şebekesinin düzenli bakımı kritik önem taşır. RenEl olarak tüm bu bileşenlerin periyodik kontrolünü, bakımını ve onarımını uzman ekibimizle yürütüyoruz.',
    description2:
      'AG (alçak gerilim) ve OG (orta gerilim) sistemlerde standartlara uygun bakım ve onarım hizmeti sunan ekibimiz, planlı bakımlarla beklenmedik arızaların ve üretim kayıplarının önüne geçer.',
    features: [
      'Trafo bakım ve onarımı',
      'AG/OG pano bakım onarımı',
      'Dağıtım şebekesi kontrolü',
      'Periyodik test ve ölçümler',
      'Arıza tespiti ve onarımı',
      'Standartlara uygun mühendislik hizmeti',
    ],
    waMessage: 'Merhaba, trafo, pano ve elektrik altyapısı bakım onarım hizmeti hakkında bilgi almak istiyorum.',
  },
  {
    slug: 'proje-danismanlik',
    icon: ClipboardList,
    title: 'Proje Danışmanlığı',
    photoAlt: 'GES proje danışmanlığı - mühendisler fizibilite ve yatırım analizi yapıyor',
    photo: '/proje-danismanlik.webp',
    subtitle: 'GES yatırımınızı doğru planlamak için fizibilite, mühendislik tasarımı ve mevzuat danışmanlığı.',
    description:
      'Güneş enerjisi yatırımına karar vermeden önce doğru verilere ve bağımsız bir mühendislik görüşüne ihtiyaç duyulur. RenEl olarak yatırımcılara fizibilite analizi, yıllık üretim tahmini ve yatırım geri dönüş hesabı sunuyoruz.',
    description2:
      'Teşvik mekanizmaları, lisanssız üretim mevzuatı ve şebeke bağlantı süreçleri konularında da rehberlik ediyoruz. Projenizin her aşamasında yanınızda olarak doğru kararları almanıza destek sağlıyoruz.',
    features: [
      'Fizibilite analizi ve üretim tahmini',
      'Yatırım geri dönüş hesabı',
      'Proje tasarımı ve mühendislik',
      'Teşvik mekanizmaları danışmanlığı',
      'Lisanssız üretim mevzuatı',
      'Şebeke bağlantı süreci yönetimi',
    ],
    waMessage: 'Merhaba, GES proje danışmanlığı hakkında bilgi almak istiyorum. Fizibilite ve yatırım analizi için görüşme talep ediyorum.',
  },
  {
    slug: 'enerji-danismanlik',
    icon: FileBarChart,
    title: 'Enerji Danışmanlığı',
    photoAlt: 'Enerji danışmanlığı - elektrik faturası analizi ve reaktif enerji izleme',
    photo: '/enerji-danismanlik.webp',
    subtitle: 'Elektrik faturalarınızdan reaktif ceza risklerine kadar enerji giderlerinizi uzman gözüyle takip ediyoruz.',
    description:
      'İşletmenizin veya tesisinizin enerji giderlerini kontrol altında tutmak, gereksiz cezalardan kaçınmak ve doğru tarifeyi seçmek için uzman desteğine ihtiyaç vardır. RenEl olarak elektrik faturalarınızı düzenli olarak kontrol ediyor, reaktif enerji tüketiminizi izleyerek ceza riskini önceden tespit ediyoruz.',
    description2:
      'Fatura analiz ve raporlamanın yanı sıra elektrik abonelik işlemleri, perakende satış sözleşmelerinin takibi ve risk analizi konularında da danışmanlık veriyoruz. Gerektiğinde sahada keşif ve inceleme yaparak tespitlerimizi somut verilerle destekliyoruz.',
    features: [
      'Reaktif ceza kontrolü ve reaktif enerji izleme',
      'Elektrik faturalarının kontrolü',
      'Fatura analiz ve raporlama',
      'Elektrik abonelik işlemleri',
      'Perakende satış sözleşmelerinin takibi',
      'Risk analizi, keşif ve saha incelemeleri',
    ],
    waMessage: 'Merhaba, enerji danışmanlığı hizmetleriniz hakkında bilgi almak istiyorum. Elektrik faturası ve reaktif enerji kontrolü konusunda görüşmek istiyorum.',
  },
]

export default function HizmetDetay() {
  const { slug } = useParams()
  const service = services.find((s) => s.slug === slug)

  const activeChipRef = useRef(null)
  const chipContainerRef = useRef(null)

  useEffect(() => {
    const container = chipContainerRef.current
    const chip = activeChipRef.current
    if (!container || !chip) return
    container.scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2
  }, [slug])

  if (!service) return <Navigate to="/hizmetler" replace />

  const Icon = service.icon

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    image: `https://renelenerji.com${service.photo}`,
    url: `https://renelenerji.com/hizmetler/${service.slug}`,
    provider: { '@type': 'Organization', name: 'RenEL Enerji Mühendislik', url: 'https://renelenerji.com' },
    areaServed: { '@type': 'Place', name: 'Soma, Manisa, Türkiye' },
  }

  return (
    <>
      <SEO
        title={service.title}
        description={`${service.subtitle} ${service.description}`.slice(0, 160)}
        image={`https://renelenerji.com${service.photo}`}
        jsonLd={jsonLd}
      />
      <PageHeader
        title={service.title}
        parent={{ to: '/hizmetler', label: 'Hizmetler' }}
      />

      {/* Mobile: yatay chip navigasyon */}
      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-24 z-40">
        <div ref={chipContainerRef} className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {services.map((s) => {
            const SIcon = s.icon
            const active = s.slug === slug
            return (
              <Link
                key={s.slug}
                ref={active ? activeChipRef : null}
                to={`/hizmetler/${s.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#448834] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <SIcon size={12} />
                {s.title}
              </Link>
            )
          })}
        </div>
      </div>

      <section className="py-8 lg:py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-7 items-start">

            {/* Sidebar — sadece desktop */}
            <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#448834] px-5 py-4">
                  <p className="text-white font-bold text-sm">Hizmetlerimiz</p>
                </div>
                <nav className="divide-y divide-gray-50">
                  {services.map((s) => {
                    const SIcon = s.icon
                    const active = s.slug === slug
                    return (
                      <Link
                        key={s.slug}
                        to={`/hizmetler/${s.slug}`}
                        className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors group ${
                          active
                            ? 'bg-[#448834]/8 text-[#448834] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#448834]'
                        }`}
                      >
                        <SIcon size={15} className={active ? 'text-[#448834]' : 'text-gray-400 group-hover:text-[#448834]'} />
                        <span className="flex-1 leading-snug">{s.title}</span>
                        {active && <ChevronRight size={13} className="text-[#448834]" />}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Sidebar CTA */}
              <div className="mt-4 bg-[#448834] rounded-2xl p-5 text-center">
                <p className="text-white font-bold text-sm mb-1">Ücretsiz Keşif</p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">Projeniz için saha analizi ve fizibilite ücretsizdir.</p>
                <a
                  href={waLink(service.waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white text-[#448834] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Teklif Al
                </a>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">

              {/* Hero image */}
              <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 lg:h-96 mb-6 shadow-md">
                <img
                  src={service.photo}
                  alt={service.photoAlt ?? service.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-1.5 bg-[#448834] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <Icon size={11} />
                    HİZMETLERİMİZ
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{service.subtitle}</h1>
                </div>
              </div>

              {/* Text content */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">RenEl Enerji Mühendislik</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">{service.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{service.description}</p>
                <p className="text-gray-600 leading-relaxed">{service.description2}</p>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">Öne Çıkan Özellikler</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-[#448834] shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile CTA */}
              <div className="lg:hidden bg-[#448834] rounded-2xl p-5 text-center mb-6">
                <p className="text-white font-bold text-sm mb-1">Ücretsiz Keşif</p>
                <p className="text-white/75 text-xs mb-4 leading-relaxed">Projeniz için saha analizi ve fizibilite ücretsizdir.</p>
                <a
                  href={waLink(service.waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white text-[#448834] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Teklif Al
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>
    </>
  )
}
