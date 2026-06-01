import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, CheckCircle2, X, Zap } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const images = [
  '/hayvan-ciftligi/SnapInsta.to_581867901_17858371554551552_1664283504094743853_n.webp',
  '/hayvan-ciftligi/SnapInsta.to_581865005_17858371542551552_3948687021531757533_n.webp',
  '/hayvan-ciftligi/SnapInsta.to_583637153_17858371530551552_7037390681860944930_n.webp',
  '/hayvan-ciftligi/SnapInsta.to_582194221_17858371521551552_1754378382427015973_n.webp',
]

const specs = [
  '4,6 kW Yüksek Verimli Güneş Paneli Grubu',
  '5 kWh LiFePO₄ Uzun Ömürlü Batarya',
  'Çatı Tipi Montaj Sistemi',
]

const advantages = [
  'Elektrik kesintilerinden etkilenmeyen çalışma',
  'Süt sağım, havalandırma, aydınlatma ve su motorları için kararlı enerji',
  'Gece kullanımında kesintisiz enerji desteği',
  'Düşük bakım maliyeti, uzun ömürlü depolama teknolojisi',
  'Tarım ve hayvancılık işletmeleri için ideal çözüm',
]

export default function HayvanCiftligiGes() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  const lightboxPrev = (e) => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length) }
  const lightboxNext = (e) => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length) }

  return (
    <>
      <PageHeader title="Hayvan Çiftliği GES Kurulumu" parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />

      {/* Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">

          {/* Gallery */}
          <div>
            <div
              className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-4/3 mb-3 group cursor-pointer"
              onClick={() => setLightbox(current)}
            >
              <img
                src={images[current]}
                alt={`Proje görseli ${current + 1}`}
                className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">Büyüt</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                <ArrowLeft size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                <ArrowRight size={16} />
              </button>
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                {current + 1} / {images.length}
              </span>
            </div>

            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-[#448834]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Proje Hakkında</h2>
              <p className="text-gray-600 leading-relaxed">
                Hayvan çiftliği için özel olarak tasarladığımız 4,6 kW çatı tipi GES sistemi ve 5 kWh LiFePO₄
                batarya kurulumu başarıyla tamamlandı. Çiftlikteki temel elektrik ihtiyaçları artık yenilenebilir
                enerji ile kesintisiz ve ekonomik şekilde karşılanıyor.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sistem Özellikleri</h2>
              <ul className="space-y-3">
                {specs.map(s => (
                  <li key={s} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#448834] shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Hayvancılık İşletmeleri İçin Avantajlar</h2>
              <ul className="space-y-3">
                {advantages.map(a => (
                  <li key={a} className="flex items-start gap-3">
                    <Zap size={16} className="text-[#f5ce31] shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{a}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">4,6 kW</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Kurulu Güç</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">5 kWh</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Depolama</p>
              </div>
            </div>

            <Link
              to="/iletisim"
              className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#448834]/25"
            >
              Benzer Proje İçin Teklif Al
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-5 right-5 text-white/70 hover:text-white" onClick={() => setLightbox(null)}>
            <X size={28} />
          </button>
          <button className="absolute left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white" onClick={lightboxPrev}>
            <ArrowLeft size={28} />
          </button>
          <img
            src={images[lightbox]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            onClick={e = loading="lazy"> e.stopPropagation()}
          />
          <button className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white" onClick={lightboxNext}>
            <ArrowRight size={28} />
          </button>
          <span className="absolute bottom-5 text-white/50 text-sm">{lightbox + 1} / {images.length}</span>
        </div>
      )}
    </>
  )
}
