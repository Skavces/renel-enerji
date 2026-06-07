import { useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Award, Wrench, Leaf, BarChart3, HeartHandshake, CheckCircle, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import SEO from '../../components/SEO'
import { waLink } from '../../lib/whatsapp'

const pages = [
  {
    slug: 'muhendislik-altyapisi',
    icon: Award,
    title: 'Mühendislik Altyapısı',
    photo: '/hizmetler detay/muhendislik-altyapisi.jpg',
    subtitle: 'Her proje, Elektrik-Elektronik Mühendisi gözetiminde tasarlanır ve kurulur.',
    description:
      'RenEl Enerji\'de her güneş enerjisi projesi, Elektrik-Elektronik Mühendisi liderliğinde yürütülür. Sistem hesaplamaları, kablo seçimi, inverter uyumu ve şebeke bağlantı projeleri teknik standartlara tam uygunlukla hazırlanır. Bu yaklaşım hem sistem güvenliğini hem de uzun vadeli verimi garantiler.',
    description2:
      'Mühendislik altyapımız sayesinde kurduğumuz her sistem hem yasal mevzuata hem de uluslararası teknik standartlara uygundur. Lisanssız ya da projesiz kurulum yapmıyoruz.',
    features: [
      'TC onaylı elektrik mühendislik projesi',
      'Sistem simülasyonu ve enerji verimliliği analizi',
      'Doğru kablo, sigorta ve inverter seçimi',
      'Yük hesabı ve şebeke bağlantı projelendirmesi',
      'İSG standartlarına uygun kurulum denetimi',
      'Proje sonrası teknik dokümantasyon',
    ],
    waMessage: 'Merhaba, mühendislik altyapınız hakkında daha fazla bilgi almak istiyorum. Projemi değerlendirir misiniz?',
  },
  {
    slug: 'anahtar-teslim-hizmet',
    icon: Wrench,
    title: 'Anahtar Teslim Hizmet',
    photo: '/hizmetler detay/anahtar-teslim-hizmet.jpg',
    subtitle: 'Fizibilite çalışmasından devreye almaya kadar her adımı biz yönetiyoruz.',
    description:
      'Güneş enerjisi kurulum sürecinin her aşaması kendi içinde uzmanlık gerektirir. RenEl olarak; saha analizi, mühendislik tasarımı, tedarik, montaj, elektrik bağlantısı, TEDAŞ/lisanslama işlemleri ve devreye alma dahil tüm süreci sizin yerinize yönetiyoruz. Siz sadece sonucu görürsünüz.',
    description2:
      'Anahtar teslim modelimizle müşterilerimiz hiçbir bürokratik yük taşımaz; tüm izin, belge ve kurulum süreçleri ekibimiz tarafından yürütülür.',
    features: [
      'Ücretsiz saha analizi ve fizibilite raporu',
      'Mühendislik projesi ve izin/lisans işlemleri',
      'Sertifikalı ekipman tedariki',
      'Profesyonel montaj ve elektrik bağlantısı',
      'TEDAŞ şebeke bağlantısı ve sayaç anlaşması',
      'Devreye alma ve sistem testi',
      'Garanti kapsamında kurulum sonrası destek',
    ],
    waMessage: 'Merhaba, anahtar teslim GES kurulumu hakkında bilgi almak istiyorum. Süreci detaylı anlatır mısınız?',
  },
  {
    slug: 'surdurulebilir-enerji',
    icon: Leaf,
    title: 'Sürdürülebilir Enerji',
    photo: '/hizmetler detay/surdurulebilir_enerji.jpg',
    subtitle: 'Karbon ayak izinizi azaltın, geleceğe yatırım yapın.',
    description:
      'Güneş enerjisi yalnızca elektrik faturasını düşürmez; aynı zamanda gezegenimiz için somut bir fark yaratır. RenEl tarafından kurulan her sistem, yılda tonlarca CO₂ emisyonunu önler ve yerel enerji bağımsızlığına katkı sağlar. Sürdürülebilir bir enerji geleceği için bugün adım atın.',
    description2:
      'Güneş enerjisi hem doğaya hem cebinize yapılan en akıllı yatırımlardan biridir. Kurulum maliyetleri ortalama 4–7 yılda kendini amorti eder.',
    features: [
      'Yılda ortalama 2–8 ton CO₂ tasarrufu (sisteme göre)',
      '25+ yıl panel ömrü ile uzun vadeli çevre katkısı',
      'Fosil yakıt bağımlılığını azaltma',
      'Yerel enerji üretimi ile şebeke yükünü hafifletme',
      'Tarımsal sistemlerde dizel pompa maliyetini sıfırlama',
      'Yeşil enerji teşvik ve desteklerinden yararlanma',
    ],
    waMessage: 'Merhaba, sürdürülebilir enerji yatırımı hakkında bilgi almak istiyorum. Sistemin geri dönüş süresini öğrenebilir miyim?',
  },
  {
    slug: 'verimlilik-odakli',
    icon: BarChart3,
    title: 'Verimlilik Odaklı',
    photo: '/hizmetler detay/verimlilik_odakli.jpg',
    subtitle: 'Simülasyon ve yerinde analiz ile her projede maksimum verim.',
    description:
      'Güneş enerjisi sistemlerinde verim, yalnızca panel kalitesiyle değil; doğru yönelim, eğim açısı, gölgeleme analizi ve sistem boyutlandırmasıyla şekillenir. RenEl ekibi, kurulum öncesinde detaylı simülasyon ve saha analizleriyle sisteminizin en yüksek enerji üretimini sağlamasını garantiler.',
    description2:
      'Her projeye ait simülasyon raporu ve beklenen yıllık üretim değeri kurulum öncesinde müşterilerimizle paylaşılır. Sürpriz olmaz.',
    features: [
      'Profesyonel simülasyon yazılımı ile enerji analizi',
      'Gölgeleme, yönelim ve eğim optimizasyonu',
      'Doğru inverter ve panel kapasitesi hesabı',
      'Yıllık beklenen üretim ve gelir tahmini raporu',
      'Sistem kayıplarının minimize edilmesi',
      'Kurulum sonrası izleme ile gerçek verim takibi',
    ],
    waMessage: 'Merhaba, güneş enerjisi sistemimin verimliliği hakkında bilgi almak ve simülasyon yaptırmak istiyorum.',
  },
  {
    slug: 'yerel-ve-guvenilir',
    icon: HeartHandshake,
    title: 'Yerel ve Güvenilir',
    photo: '/hizmetler detay/yerel_ve_guvenilir.jpg',
    subtitle: 'Soma/Manisa merkezli ekibimizle kurulum sonrası da yanınızdayız.',
    description:
      'Pek çok firma kurulumu tamamlayıp ayrılır. RenEl\'de ise ilişki kurulumla bitmez. Manisa ve Soma merkezli ekibimiz, sisteminizin tüm ömrü boyunca bakım, arıza müdahalesi ve uzaktan izleme hizmetleri için ulaşılabilir durumdadır.',
    description2:
      'Kurulum sonrası ortaya çıkan her sorunda bölgemizde yerelde olmanın avantajıyla en kısa sürede müdahale ediyoruz. Uzaktan destek + saha ekibi her zaman hazır.',
    features: [
      'Soma ve Manisa ilçelerine hızlı saha erişimi',
      'Kurulum sonrası yıllık bakım sözleşmesi seçeneği',
      'Arıza tespiti ve hızlı müdahale',
      'Uzaktan izleme ve anlık sistem takibi',
      'Panel temizliği ve mekanik periyodik kontrol',
      'Güven veren yerel referanslar ve müşteri ağı',
    ],
    waMessage: 'Merhaba, Manisa/Soma bölgesinde GES kurulumu yaptırmak istiyorum. Bölgenizde hizmet veriyor musunuz?',
  },
  {
    slug: 'onayli-ekipmanlar',
    icon: CheckCircle,
    title: 'Onaylı Ekipmanlar',
    photo: '/hizmetler detay/onayli_ekipmanlar.jpg',
    subtitle: 'Yalnızca sertifikalı, garantili ve sahada kanıtlanmış ekipmanlar.',
    description:
      'Güneş enerjisi sisteminizin ömrü büyük ölçüde kullanılan ekipmanların kalitesine bağlıdır. RenEl olarak çalıştığımız her marka ve ürün; IEC, CE ve TSE gibi uluslararası standartlara sahip, tedarikçi garantili ve sahada kanıtlanmış ürünlerdir.',
    description2:
      'Kullandığımız panellerde 25 yıl üretim garantisi, invertörlerde 5–10 yıl üretici garantisi standart olarak sunulmaktadır. Ucuz malzemeyle kısa vadeli çözüm sunmuyoruz.',
    features: [
      'IEC 61215 / IEC 61730 sertifikalı güneş panelleri',
      'CE belgeli invertörler (SMA, Huawei, Fronius vb.)',
      'Rüzgar ve kar yüküne dayanıklı sertifikalı taşıyıcı sistemler',
      'UL/IEC onaylı LiFePO4 batarya sistemleri',
      'Yangına karşı güvenli kablo ve bağlantı elemanları',
      'Tüm ekipmanlarda tedarikçi garantisi ve yedek parça desteği',
    ],
    waMessage: 'Merhaba, kullandığınız ekipmanlar ve markalar hakkında bilgi almak istiyorum.',
  },
]

export default function NedenBizDetay() {
  const { slug } = useParams()
  const page = pages.find((p) => p.slug === slug)

  const activeChipRef = useRef(null)
  const chipContainerRef = useRef(null)

  useEffect(() => {
    const container = chipContainerRef.current
    const chip = activeChipRef.current
    if (!container || !chip) return
    container.scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2
  }, [slug])

  if (!page) return <Navigate to="/" replace />

  const Icon = page.icon

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${page.title} | RenEL Enerji Mühendislik`,
    description: page.description,
    url: `https://renelenerji.com/neden-biz/${page.slug}`,
    publisher: { '@type': 'Organization', name: 'RenEL Enerji Mühendislik', url: 'https://renelenerji.com' },
  }

  return (
    <>
      <SEO
        title={page.title}
        description={`${page.subtitle} ${page.description}`.slice(0, 160)}
        jsonLd={jsonLd}
      />
      <PageHeader
        title={page.title}
        parent={{ to: '/kurumsal', label: 'Neden Biz?' }}
      />

      {/* Mobile: yatay chip navigasyon */}
      <div className="lg:hidden bg-white border-b border-gray-100 sticky top-24 z-40">
        <div ref={chipContainerRef} className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {pages.map((p) => {
            const PIcon = p.icon
            const active = p.slug === slug
            return (
              <Link
                key={p.slug}
                ref={active ? activeChipRef : null}
                to={`/neden-biz/${p.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#448834] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <PIcon size={12} />
                {p.title}
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
                  <p className="text-white font-bold text-sm">Neden RenEl?</p>
                </div>
                <nav className="divide-y divide-gray-50">
                  {pages.map((p) => {
                    const PIcon = p.icon
                    const active = p.slug === slug
                    return (
                      <Link
                        key={p.slug}
                        to={`/neden-biz/${p.slug}`}
                        className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors group ${
                          active
                            ? 'bg-[#448834]/8 text-[#448834] font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-[#448834]'
                        }`}
                      >
                        <PIcon size={15} className={active ? 'text-[#448834]' : 'text-gray-400 group-hover:text-[#448834]'} />
                        <span className="flex-1 leading-snug">{p.title}</span>
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
                  href={waLink(page.waMessage)}
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
                  src={page.photo}
                  alt={page.title}
                  className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-1.5 bg-[#448834] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    <Icon size={11} />
                    NEDEN RenEl?
                  </span>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{page.subtitle}</h1>
                </div>
              </div>

              {/* Text content */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">RenEl Enerji Mühendislik</p>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5">{page.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{page.description}</p>
                <p className="text-gray-600 leading-relaxed">{page.description2}</p>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-4 sm:mb-6">
                <h3 className="font-bold text-gray-900 text-base mb-4 sm:mb-5">Öne Çıkan Özellikler</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {page.features.map((f) => (
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
                  href={waLink(page.waMessage)}
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
