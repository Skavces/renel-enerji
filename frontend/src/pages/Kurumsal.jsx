import { Link } from 'react-router-dom'
import { CheckCircle, Award, Wrench, HeartHandshake, Leaf, BarChart3, ArrowRight, ArrowUpRight, MapPin, Sun, ClipboardCheck, Zap, FileText, Factory } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SEO from '../components/SEO'

const values = [
  {
    icon: Award,
    title: 'Mühendislik Altyapısı',
    desc: 'Elektrik-Elektronik Mühendisi liderliğinde, her proje teknik standartlara uygun biçimde tasarlanır ve kurulur.',
  },
  {
    icon: Wrench,
    title: 'Anahtar Teslim Hizmet',
    desc: 'Fizibilite çalışmasından lisanslama, montaj ve devreye almaya kadar her adımı biz üstleniyoruz.',
  },
  {
    icon: Leaf,
    title: 'Sürdürülebilir Enerji',
    desc: 'Karbon ayak izinizi azaltırken enerji maliyetlerinizi düşürün. Geleceğe yatırım yapın.',
  },
  {
    icon: BarChart3,
    title: 'Verimlilik Odaklı',
    desc: 'Sistem simülasyonları ve yerinde analiz ile maksimum enerji üretimi sağlayan optimum sistem tasarımı.',
  },
  {
    icon: HeartHandshake,
    title: 'Yerel ve Güvenilir',
    desc: 'Soma/Manisa merkezli ekibimizle kurulum sonrası bakım, arıza ve izleme hizmetleri yanınızda.',
  },
  {
    icon: CheckCircle,
    title: 'Onaylı Ekipmanlar',
    desc: 'Yalnızca sertifikalı ve garantili paneller, invertörler ve montaj sistemleri kullanıyoruz.',
  },
]


const stats = [
  { value: '9+', label: 'Tamamlanan Proje' },
  { value: '25 Yıl', label: 'Panel Garantisi' },
  { value: '4', label: 'Hizmet Alanı' },
  { value: '0₺', label: 'Keşif Ücreti' },
]

const experiences = [
  {
    value: '15 Yıl',
    title: 'Enerji Dağıtım ve Yönetim Tecrübesi',
    desc: 'Kurucu kadromuzda; Gediz Elektrik ve GDZ Elektrik bünyesinde 15 yıllık sektör deneyimi, 10 yıllık yöneticilik geçmişi ve Manisa genelinde bölge yönetimi tecrübesi bulunmaktadır. Elektrik piyasası mevzuatı, resmi kurum süreçleri, bağlantı anlaşmaları, enerji altyapısı ve yatırım danışmanlığı alanlarındaki birikimimizi müşterilerimizin hizmetine sunuyoruz.',
  },
  {
    value: '5 Yıl',
    title: 'Uluslararası Teknik Denetim ve Kalite Mühendisliği',
    desc: 'TÜV SÜD bünyesinde edinilen 5 yıllık saha kontrol mühendisliği, kalite güvence, GES projeleri ve fotovoltaik modül üretim denetimi tecrübemizi ulusal ölçekteki projelere taşıyoruz.',
  },
]

// location boşsa MapPin satırı render edilmez
const fieldProjects = [
  {
    location: 'Malatya ve Bingöl',
    title: '3 Aktif Proje',
    desc: 'İşveren mühendislik kapsamında üç ayrı enerji projesinde kalite mühendisliği ve saha denetim hizmetleri yürütüyoruz.',
  },
  {
    location: '', // TODO: konum eklenecek
    title: '3 GES — Toplam 10 MW',
    desc: 'Üç güneş enerjisi santralinin izleme, arıza tespiti, onarım ve trafo işletme sorumluluğu hizmetlerini üstleniyoruz.',
  },
]

const activityAreas = [
  { icon: Sun, text: 'Güneş enerjisi santralleri ve EPC hizmetleri' },
  { icon: ClipboardCheck, text: 'Teknik müşavirlik, işveren mühendisliği ve kalite kontrol' },
  { icon: Zap, text: 'OG/YG tesisleri ve trafo işletme sorumluluğu' },
  { icon: Wrench, text: 'GES işletme, bakım, izleme ve arıza yönetimi' },
  { icon: FileText, text: 'Enerji mevzuatı, resmi kurum ve yatırım danışmanlığı' },
  { icon: Factory, text: 'Elektrik proje, taahhüt ve enerji altyapısı' },
  { icon: Leaf, text: 'Enerji verimliliği ve sürdürülebilir enerji çözümleri' },
]

const founders = [
  { name: 'Mertcan Yılmaz', url: 'https://www.linkedin.com/in/mertcan-y%C4%B1lmaz-ab1429209/' },
  { name: 'Muammer Yılmaz', url: 'https://www.linkedin.com/in/muammer-y%C4%B1lmaz-433742146/' },
]

const collagePhotos = [
  '/whyus/muhendislik-altyapisi.webp',
  '/whyus/verimlilik-odakli.webp',
  '/whyus/yerel-ve-guvenilir.webp',
  '/whyus/onayli-ekipmanlar.webp',
]

export default function Kurumsal() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: 'https://renelenerji.com/kurumsal',
    name: 'Kurumsal | RenEl Enerji Mühendislik',
    description: 'RenEl Enerji Mühendislik hakkında. Elektrik-Elektronik Mühendisi liderliğinde, Soma/Manisa\'da anahtar teslim güneş enerjisi çözümleri sunan mühendislik firması.',
    mainEntity: {
      '@type': 'Organization',
      name: 'RenEl Enerji Mühendislik',
      url: 'https://renelenerji.com',
      logo: 'https://renelenerji.com/renel-logo.svg',
      telephone: '+90-554-379-60-04',
      email: 'mertcan.yilmaz@renelenerji.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Kurtuluş, İnkılap Sk. no:4 D:J',
        addressLocality: 'Soma',
        addressRegion: 'Manisa',
        postalCode: '45500',
        addressCountry: 'TR',
      },
      knowsAbout: ['Güneş Enerjisi Sistemleri', 'GES Kurulumu', 'Tarımsal Sulama GES', 'Off-Grid Sistemler', 'EV Şarj İstasyonu'],
    },
  }

  return (
    <>
      <SEO
        title="Kurumsal"
        description="RenEl Enerji Mühendislik hakkında. Elektrik-Elektronik Mühendisi liderliğinde, Soma/Manisa'da anahtar teslim güneş enerjisi çözümleri sunan mühendislik firması."
        jsonLd={jsonLd}
      />
      <PageHeader title="Kurumsal" />

      {/* Hero split: photo collage left, content right */}
      <section className="relative py-20 bg-white overflow-hidden">
        <img src="/stats.webp" alt="" className="absolute bottom-0 right-0 w-140 opacity-50 pointer-events-none select-none" loading="lazy" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* Photo collage */}
          <div className="relative border-2 border-[#448834] rounded-3xl p-3">
            <div className="absolute -top-7 -left-7 z-20">
              <div className="w-24 h-24 rounded-full border-2 border-[#448834] bg-white shadow-lg flex items-center justify-center">
                <img src="/renel-logo.svg" alt="RenEl" className="w-16 h-16" loading="lazy" />
              </div>
            </div>
            <div className="flex gap-3 h-80 sm:h-105 lg:h-140">
              {/* Sol kolon */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-3 overflow-hidden rounded-xl">
                  <img src={collagePhotos[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="flex-2 overflow-hidden rounded-xl">
                  <img src={collagePhotos[1]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
              </div>
              {/* Sağ kolon */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-2 overflow-hidden rounded-xl">
                  <img src={collagePhotos[2]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="flex-3 overflow-hidden rounded-xl">
                  <img src={collagePhotos[3]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-4">RenEl Enerji Mühendislik</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Enerjinin Gücünü<br />Her Noktaya Taşıyoruz
            </h2>
            <p className="text-gray-500 leading-relaxed mb-5">
              RenEl Enerji Mühendislik, Manisa/Soma'da Elektrik-Elektronik Mühendisliği altyapısıyla kurulmuş
              bir güneş enerjisi firmasıdır. Tarımsal sulama sistemlerinden çatı ve arazi tipi GES'lere,
              depolamalı bağ evi çözümlerinden elektrikli araç şarj istasyonlarına kadar geniş bir yelpazede
              hizmet veriyoruz.
            </p>
            <p className="text-gray-500 leading-relaxed mb-10">
              Her projeyi sıfırdan anahtar teslim yürütüyoruz: fizibilite, mühendislik projesi, kurulum,
              devreye alma ve sonrası. Müşterilerimizin enerji bağımsızlığı kazanması en temel hedefimizdir.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 py-8 border-y border-gray-100">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-[#448834] font-bold text-3xl font-['Rajdhani'] leading-none mb-1">{value}</p>
                  <p className="text-gray-500 text-xs leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Biz Kimiz */}
      <section id="biz-kimiz" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">Biz Kimiz</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-5">Enerjide Tecrübe, Sahada Güven</h2>
            <p className="text-gray-500 leading-relaxed max-w-3xl mx-auto">
              Enerji sektöründe edindiğimiz yöneticilik, mühendislik ve teknik denetim tecrübemizi bir araya
              getirerek; enerji yatırımlarının planlanmasından işletilmesine kadar her aşamada profesyonel
              çözümler sunuyoruz. Gücümüz tecrübemizden, güvenimiz sahadaki çalışmalarımızdan geliyor.
            </p>
          </div>

          {/* Experience: subgrid ile sayı/başlık/paragraf satırları iki kartta hizalı */}
          <div className="grid md:grid-cols-2 md:grid-rows-[auto_auto_1fr] gap-5 md:gap-y-0">
            {experiences.map(({ value, title, desc }) => (
              <div key={title} className="flex flex-col md:grid md:row-span-3 md:grid-rows-subgrid p-6 sm:p-8 bg-white rounded-2xl border border-gray-100 hover:border-[#448834]/30 hover:shadow-md transition-all">
                <p className="text-[#448834] font-bold text-5xl font-['Rajdhani'] leading-none mb-5">{value}</p>
                <h3 className="font-bold text-gray-900 text-base leading-snug mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Field projects */}
          <div className="mt-16 sm:mt-20 flex items-center justify-center gap-5 mb-8">
            <div className="hidden sm:block h-px flex-1 bg-gray-200" aria-hidden="true" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center text-balance">Bugün sahadayız, projelerin içindeyiz</h3>
            <div className="hidden sm:block h-px flex-1 bg-gray-200" aria-hidden="true" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {fieldProjects.map(({ location, title, desc }) => (
              <div key={title} className="flex flex-col h-full p-6 sm:p-8 bg-white rounded-2xl border border-gray-100 hover:border-[#448834]/30 hover:shadow-md transition-all">
                <h4 className="font-bold text-gray-900 text-lg leading-snug mb-3">{title}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                {location && (
                  <div className="flex items-center gap-2 mt-auto pt-5">
                    <MapPin size={20} aria-hidden="true" className="text-[#448834] shrink-0" />
                    <span className="text-[#448834] font-semibold text-sm">{location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Activity areas */}
          <div className="mt-16 sm:mt-20 flex items-center justify-center gap-5 mb-8">
            <div className="hidden sm:block h-px flex-1 bg-gray-200" aria-hidden="true" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center">Faaliyet Alanlarımız</h3>
            <div className="hidden sm:block h-px flex-1 bg-gray-200" aria-hidden="true" />
          </div>
          {/* 7 madde: lg'de 4+3 (12 kolonlu grid), sm'de 2'li + son kart tam genişlik */}
          <ul className="grid sm:grid-cols-2 lg:grid-cols-12 gap-5">
            {activityAreas.map(({ icon, text }, i) => {
              const Icon = icon
              const span = i < 4 ? 'lg:col-span-3' : 'lg:col-span-4'
              const last = i === activityAreas.length - 1 ? 'sm:max-lg:col-span-2' : ''
              return (
                <li key={text} className={`${span} ${last}`}>
                  <div className="flex lg:flex-col items-start gap-4 lg:gap-3 h-full p-6 bg-white rounded-2xl border border-gray-100 hover:border-[#448834]/30 hover:shadow-md transition-all">
                    <Icon size={20} aria-hidden="true" className="text-[#448834] shrink-0 mt-0.5 lg:mt-0" />
                    <p className="font-bold text-gray-900 text-sm leading-snug">{text}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Closing */}
          <div className="mt-16 sm:mt-20 text-center">
            <p className="text-gray-500 leading-relaxed max-w-3xl mx-auto">
              2 elektrik mühendisi ve 2 teknik personelden oluşan ekibimizle, mühendislik disiplinini saha
              tecrübesiyle birleştiriyoruz. Hedefimiz; yatırımcılarımızın güvenle çalışabileceği, teknik
              yetkinliği yüksek, uzun vadeli bir çözüm ortağı olmaktır.
            </p>
            <div className="w-10 h-1 rounded-full bg-[#f5ce31] mx-auto my-8" aria-hidden="true" />
            <p className="text-[#448834] font-bold text-xl sm:text-2xl text-balance">Enerjide Tecrübe, Mühendislikte Güven.</p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 list-none p-0">
              {founders.map((person) => (
                <li key={person.url}>
                  <a
                    href={person.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${person.name} LinkedIn profili (yeni sekmede açılır)`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:border-[#448834] hover:text-[#448834] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#448834]"
                  >
                    {person.name}
                    <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-gray-400 transition-colors group-hover:text-[#448834] group-focus-visible:text-[#448834]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[#448834] font-semibold text-xs uppercase tracking-widest mb-3">Değerlerimiz</p>
            <h2 className="text-3xl font-bold text-gray-900">Neden RenEl?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon, title, desc }) => {
              const Icon = icon
              return (
              <div key={title} className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-[#448834]/30 hover:shadow-md transition-all">
                <Icon size={20} className="text-[#448834] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </section>


    </>
  )
}
