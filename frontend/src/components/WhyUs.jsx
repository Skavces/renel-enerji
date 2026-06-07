import { Link } from 'react-router-dom'
import { Award, Wrench, Leaf, BarChart3, HeartHandshake, CheckCircle } from 'lucide-react'

const WA_NUMBER = '905543796004'
const WA_MESSAGE = 'Merhaba, güneş enerjisi sistemleri hakkında teklif almak istiyorum. Projem için size özel bir çözüm sunabilir misiniz?'
const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`

const reasons = [
  { icon: Award, title: 'Mühendislik Altyapısı', slug: 'muhendislik-altyapisi', desc: 'Elektrik-Elektronik Mühendisi liderliğinde her proje teknik standartlara uygun tasarlanır ve kurulur.' },
  { icon: Wrench, title: 'Anahtar Teslim Hizmet', slug: 'anahtar-teslim-hizmet', desc: 'Fizibilite çalışmasından lisanslama, montaj ve devreye almaya kadar her adımı biz üstleniyoruz.' },
  { icon: Leaf, title: 'Sürdürülebilir Enerji', slug: 'surdurulebilir-enerji', desc: 'Karbon ayak izinizi azaltırken enerji maliyetlerinizi düşürün. Geleceğe yatırım yapın.' },
  { icon: BarChart3, title: 'Verimlilik Odaklı', slug: 'verimlilik-odakli', desc: 'Simülasyon ve yerinde analiz ile maksimum enerji üretimini sağlayan optimum sistem tasarımı.' },
  { icon: HeartHandshake, title: 'Yerel ve Güvenilir', slug: 'yerel-ve-guvenilir', desc: 'Soma/Manisa merkezli ekibimizle kurulum sonrası bakım, arıza ve izleme hizmetleri yanınızda.' },
  { icon: CheckCircle, title: 'Onaylı Ekipmanlar', slug: 'onayli-ekipmanlar', desc: 'Yalnızca sertifikalı ve garantili paneller, invertörler ve montaj sistemleri kullanıyoruz.' },
]

export default function WhyUs() {
  return (
    <section id="hakkimizda" className="relative py-24 bg-gray-50 overflow-hidden">
      <img src="/neden-biz.webp" alt="" className="hidden lg:block absolute top-0 right-0 h-full w-[130%] object-cover object-right pointer-events-none select-none z-0" loading="lazy" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-10 lg:hidden">
          <span className="block text-[#357228] font-semibold text-sm mb-3">NEDEN RenEl?</span>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            Güneş Enerjisinde Güvenilir Ortağınız
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
            Manisa/Soma'da mühendislik altyapısıyla kaliteli ve uzun ömürlü güneş enerjisi sistemleri kuruyoruz.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Header — sadece desktop'ta grid içinde */}
          <div className="hidden lg:flex flex-col justify-center py-4 pr-4 text-center">
            <span className="block text-[#357228] font-semibold text-sm mb-3">NEDEN RenEl?</span>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
              Güneş Enerjisinde Güvenilir Ortağınız
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Manisa/Soma'da mühendislik altyapısıyla kaliteli ve uzun ömürlü güneş enerjisi sistemleri kuruyoruz.
            </p>
          </div>

          {/* 6 kart */}
          {reasons.map(({ icon, title, slug, desc }) => {
            const Icon = icon
            return (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 border-b-4 border-b-transparent hover:border-b-[#357228] p-7 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
                <Icon size={28} className="text-[#357228]" />
                <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                <p className="text-gray-500 text-base leading-relaxed flex-1">{desc}</p>
                <Link to={`/neden-biz/${slug}`} className="text-[#357228] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all w-fit">
                  Detaylı Bilgi <span>›</span>
                </Link>
              </div>
            )
          })}

          {/* CTA */}
          <div className="sm:col-span-2 lg:col-span-1 p-6 flex flex-col items-center justify-center text-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm lg:bg-transparent lg:border-0 lg:shadow-none">
            <h3 className="font-bold text-gray-900 text-2xl leading-snug">
              Projenizi Birlikte Hayata Geçirelim
            </h3>
            <p className="text-gray-500 text-base">Size özel çözüm için bizimle iletişime geçin.</p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#357228] text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#2d6124] transition-colors"
            >
              Teklif Al
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
