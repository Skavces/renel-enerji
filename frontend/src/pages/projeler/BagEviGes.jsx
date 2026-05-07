import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MapPin, CheckCircle2, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const images = [
  '/4kwp-bagevi/SnapInsta.to_572962383_17857134906551552_2235488587040886983_n.jpg',
  '/4kwp-bagevi/SnapInsta.to_573313405_17857134897551552_1782090065706594247_n.jpg',
  '/4kwp-bagevi/SnapInsta.to_573689641_17857134888551552_2721821468274745229_n.jpg',
]

const specs = [
  '575 W TOPCon Yüksek Verimli Güneş Panelleri',
  '6 kW Hibrit İnvertör',
  '5 kWh LiFePO₄ Lityum Demir Fosfat Batarya',
  'Alüminyum Paslanmaz Konstrüksiyon',
]

export default function BagEviGes() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  const lightboxPrev = (e) => { e.stopPropagation(); setLightbox(i => (i - 1 + images.length) % images.length) }
  const lightboxNext = (e) => { e.stopPropagation(); setLightbox(i => (i + 1) % images.length) }

  return (
    <>
      <PageHeader title="4 kWp Bağ Evi GES Sistemi" parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />

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
                className="w-full h-full object-cover"
              />
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
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Proje Hakkında</h2>
              <p className="text-gray-600 leading-relaxed">
                Doğanın içinde, sessizliğin ortasında artık enerji kesintisi yok. 4 kWp güneş enerjisi sistemiyle
                bu bağ evi şebekeden tamamen bağımsız hale geldi; tüm enerji ihtiyacını güneşten karşılıyor.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                Temiz, sürdürülebilir ve uzun ömürlü bir çözüm.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Kullanılan Ekipmanlar</h2>
              <ul className="space-y-3">
                {specs.map(s => (
                  <li key={s} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#448834] shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">4 kWp</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Kurulu Güç</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">6 kW</p>
                <p className="text-xs text-gray-400 font-medium mt-1">İnvertör</p>
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
