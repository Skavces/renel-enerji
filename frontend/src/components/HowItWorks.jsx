const steps = [
  {
    num: '01',
    title: 'Keşif & Fizibilite',
    desc: 'Yerinde inceleme ile ihtiyaç analizi yapılır, çatı/arazi ölçümü ve gölgeleme etüdü hazırlanır.',
    img: '/kesif.webp',
  },
  {
    num: '02',
    title: 'Sistem Tasarımı',
    desc: 'Mühendislik hesaplamalarıyla optimum panel kapasitesi, inverter seçimi ve elektrik projesi hazırlanır.',
    img: '/sistem-tasarimi.webp',
  },
  {
    num: '03',
    title: 'Kurulum & Montaj',
    desc: 'Sertifikalı ekibimiz tarafından standartlara uygun güvenli kurulum gerçekleştirilir.',
    img: '/kurulum-montaj.webp',
  },
  {
    num: '04',
    title: 'Devreye Alma & Takip',
    desc: 'Sistem devreye alınır, uzaktan izleme kurulur, bakım ve destek hizmeti başlar.',
    img: '/devreye-alma-takip.webp',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <img src="/nasil-calisiriz.webp" alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0" loading="lazy" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-[#448834]/5 blur-3xl" />
        <div className="absolute bottom-10 left-20 w-56 h-56 rounded-full bg-[#f5ce31]/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#357228] font-semibold text-base mb-4">
            NASIL ÇALIŞIRIZ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            4 Adımda Güneş Enerjisi
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Projenizin başından sonuna kadar şeffaf ve planlı bir süreç yürütüyoruz.
          </p>
        </div>

        {/* Steps — wave layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 items-start relative">
          {/* Wavy connector */}
          <img src="/shape.webp" alt="" className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 w-[140%] pointer-events-none select-none" loading="lazy" />

          {steps.map((s, i) => (
            <div key={s.num} className={`flex flex-col text-center ${i === 0 || i === 3 ? 'md:mt-16' : ''}`}>
              {/* Image with number badge */}
              <div className="relative mb-5 w-3/4 mx-auto pt-3 pl-3">
                <div className="aspect-square overflow-hidden rounded-xl">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="absolute top-0 left-0 w-12 h-12 rounded-full bg-[#357228] flex items-center justify-center shadow-md z-10">
                  <span className="text-white font-bold text-base font-['Rajdhani']">{s.num}</span>
                </div>
              </div>
              <h3 className="text-gray-900 font-bold text-base mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 animate-[shimmer_12s_linear_infinite]" style={{background: 'linear-gradient(90deg, #448834, #f5ce31, #448834, #f5ce31, #448834)', backgroundSize: '200% auto'}} />
    </section>
  )
}
