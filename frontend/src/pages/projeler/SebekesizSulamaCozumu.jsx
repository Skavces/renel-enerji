import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, X, Play, Zap } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const media = [
  { type: 'image', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_685360645_17882474067551552_3241083911849974964_n.webp' },
  { type: 'image', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_684650418_17882474049551552_284955555832794576_n.webp' },
  { type: 'image', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_686047932_17882474058551552_262508276789012101_n.webp' },
  { type: 'video', src: '/sebekesiz-sulama-cozumu/SnapInsta.to_AQO0z0q21Up5hQbavNOpj8ICPChj1TMNx9csHXkkTM18gC3SSYkze-4zeenssb0AcM9d9Kz6EDqAQEx_n2h1X71Q2T8aKdol6G1Rrck.mp4' },
]

const specs = [
  '2 Adet 550 Watt Güneş Paneli (Toplam 1.1 kWp)',
  '0.8 HP DC Dalgıç Pompa – 50 m derinlikten saatte 2 ton su',
  '1 HP DC Yüzey Pompası – havuzdan damlama sulama',
  'Tamamen DC sistem – inverter yok, kayıp yok!',
]

const highlights = [
  'Şebekeden tamamen bağımsız sulama sistemi',
  'Sadece 2 panelle tarla sulamaya başla',
  'DC sistem sayesinde maksimum verim, sıfır dönüşüm kaybı',
  'Güneş yoğunluğuna göre otomatik pompa hız kontrolü',
  'Minimal bakım, sıfır işletme maliyeti',
]

export default function SebekesizSulamaCozumu() {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  const prev = () => setCurrent(i => (i - 1 + media.length) % media.length)
  const next = () => setCurrent(i => (i + 1) % media.length)

  const lightboxPrev = (e) => { e.stopPropagation(); setLightbox(i => (i - 1 + media.length) % media.length) }
  const lightboxNext = (e) => { e.stopPropagation(); setLightbox(i => (i + 1) % media.length) }

  const item = media[current]

  return (
    <>
      <PageHeader title="Şebekesiz Sulama Çözümü" parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">

          {/* Gallery */}
          <div>
            <div
              className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-4/3 mb-3 group cursor-pointer"
              onClick={() => setLightbox(current)}
            >
              {item.type === 'video' ? (
                <>
                  <video src={item.src} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="bg-white/90 rounded-full p-4 shadow-lg">
                      <Play size={28} className="text-[#448834] ml-1" fill="#448834" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img src={item.src} alt={`Proje görseli ${current + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">Büyüt</span>
                  </div>
                </>
              )}
              <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                <ArrowLeft size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                <ArrowRight size={16} />
              </button>
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                {current + 1} / {media.length}
              </span>
            </div>

            <div className="flex gap-2">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${i === current ? 'border-[#448834]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  {m.type === 'video' ? (
                    <>
                      <video src={m.src} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={12} className="text-white" fill="white" />
                      </div>
                    </>
                  ) : (
                    <img src={m.src} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Proje Hakkında</h2>
              <p className="text-gray-600 leading-relaxed">
                Müşterimiz için sadece 2 adet 550W güneş paneli kullanarak şebekeden tamamen bağımsız bir sulama
                sistemi kuruldu. DC dalgıç pompa 50 metre derinlikten saatte 2 ton su çekerken, DC yüzey pompası
                havuzdan damlama sulamayı besliyor. Inverter olmadığı için dönüşüm kaybı yok, kurulum maliyeti düşük.
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Öne Çıkan Özellikler</h2>
              <ul className="space-y-3">
                {highlights.map(h => (
                  <li key={h} className="flex items-start gap-3">
                    <Zap size={16} className="text-[#f5ce31] shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">1,1 kWp</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Kurulu Güç</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">2</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Panel</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">2 Ton</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Saatte Su Debisi</p>
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
          {media[lightbox].type === 'video' ? (
            <video
              src={media[lightbox].src}
              controls
              autoPlay
              className="max-h-[85vh] max-w-[90vw] rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={media[lightbox].src}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              onClick={e => e.stopPropagation()}
            />
          )}
          <button className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white" onClick={lightboxNext}>
            <ArrowRight size={28} />
          </button>
          <span className="absolute bottom-5 text-white/50 text-sm">{lightbox + 1} / {media.length}</span>
        </div>
      )}
    </>
  )
}
