import { Link } from 'react-router-dom'
import { CheckCircle, Award, Wrench, HeartHandshake, Leaf, BarChart3, ArrowRight, Phone } from 'lucide-react'
import PageHeader from '../components/PageHeader'

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

const collagePhotos = [
  '/whyus/muhendislik-altyapisi.webp',
  '/whyus/verimlilik-odakli.webp',
  '/whyus/yerel-ve-guvenilir.webp',
  '/whyus/onayli-ekipmanlar.webp',
]

export default function Kurumsal() {
  return (
    <>
      <PageHeader title="Kurumsal" />

      {/* Hero split: photo collage left, content right */}
      <section className="relative py-20 bg-white overflow-hidden">
        <img src="/stats.webp" alt="" className="absolute bottom-0 right-0 w-[560px] opacity-50 pointer-events-none select-none" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* Photo collage */}
          <div className="relative border-2 border-[#448834] rounded-3xl p-3">
            <div className="absolute -top-7 -left-7 z-20">
              <div className="w-24 h-24 rounded-full border-2 border-[#448834] bg-white shadow-lg flex items-center justify-center">
                <img src="/renel-logo.svg" alt="RenEl" className="w-16 h-16" />
              </div>
            </div>
            <div className="flex gap-3 h-[560px]">
              {/* Sol kolon */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-3 overflow-hidden rounded-xl">
                  <img src={collagePhotos[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex-2 overflow-hidden rounded-xl">
                  <img src={collagePhotos[1]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
              {/* Sağ kolon */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex-2 overflow-hidden rounded-xl">
                  <img src={collagePhotos[2]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex-3 overflow-hidden rounded-xl">
                  <img src={collagePhotos[3]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
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

            {/* Founder */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#448834] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">MY</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Mertcan Yılmaz</p>
                <p className="text-[#448834] font-medium text-xs">Elektrik - Elektronik Mühendisi</p>
                <p className="text-gray-400 text-xs">RenEl Enerji Mühendislik Kurucusu</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
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
