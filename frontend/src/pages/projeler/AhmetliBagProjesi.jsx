import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, Zap, CheckCircle2, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const images = [
  '/bag-projesi/SnapInsta.to_658048509_17877068112551552_3955411799585925962_n.jpg',
  '/bag-projesi/SnapInsta.to_658993120_17877068097551552_530301442728432572_n.jpg',
  '/bag-projesi/SnapInsta.to_656829483_17877068085551552_9099235329430647652_n.jpg',
  '/bag-projesi/SnapInsta.to_657225888_17877068076551552_781352117709125062_n.jpg',
  '/bag-projesi/SnapInsta.to_656367211_17877068067551552_5595932734356314435_n.jpg',
]

const specs = [
  '28 Adet 600W Kalyon Güneş Paneli',
  '15 HP (11 kW) Mexxsun Sürücü',
  'Uzaktan Kontrol ve Çalıştırma Sistemi',
  '12.5 HP Dalgıç Pompa Uyumu',
]

export default function AhmetliBagProjesi() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  const lightboxPrev = (e) => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length) }
  const lightboxNext = (e) => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length) }

  return (
    <>
      <PageHeader title="Ahmetli Bağ Sulama Projesi" parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />

      {/* Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">

          {/* Gallery */}
          <div>
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-4/3 mb-3 group cursor-pointer" onClick={() => setLightbox(current)}>
              <img
                src={images[current]}
                alt={`Proje görseli ${current + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">
                  Büyüt
                </span>
              </div>
              {/* Arrows */}
              <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                <ArrowLeft size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                <ArrowRight size={16} />
              </button>
              {/* Counter */}
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                {current + 1} / {images.length}
              </span>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-[#448834]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Proje Hakkında</h2>
              <p className="text-gray-600 leading-relaxed">
                Manisa Ahmetli'de gerçekleştirdiğimiz bu projede, bağ alanının üzerine kurduğumuz akıllı sistemle
                tarımsal sulamada enerji maliyetlerini sıfırladık.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                Çiftçimiz artık telefonundan tek tıkla sulama sistemini yönetiyor, enerjisini doğrudan güneşten alıyor.
                Verimli, çevreci ve ekonomik bir çözüm.
              </p>
            </div>

            {/* Specs */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sistem Detayları</h2>
              <ul className="space-y-3">
                {specs.map(s => (
                  <li key={s} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#448834] shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap size={14} className="text-[#448834]" />
                  <span className="text-xs text-gray-400 font-medium">Kurulu Güç</span>
                </div>
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">11 kW</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs text-gray-400 font-medium">Panel Sayısı</span>
                </div>
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">28 Adet</p>
              </div>
            </div>

            {/* CTA */}
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
            onClick={e => e.stopPropagation()}
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
