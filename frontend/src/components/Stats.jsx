import { useEffect, useRef, useState } from 'react'

const PanelIllustration = () => (
  <svg viewBox="0 0 120 70" fill="none" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full opacity-[0.15]">
    {/* Ground */}
    <line x1="0" y1="58" x2="120" y2="58" />
    {/* Panel left */}
    <rect x="8" y="28" width="44" height="26" rx="1" />
    <line x1="8" y1="37" x2="52" y2="37" />
    <line x1="8" y1="46" x2="52" y2="46" />
    <line x1="22" y1="28" x2="22" y2="54" />
    <line x1="37" y1="28" x2="37" y2="54" />
    {/* Panel stand left */}
    <line x1="24" y1="54" x2="20" y2="58" />
    <line x1="37" y1="54" x2="40" y2="58" />
    {/* Panel right */}
    <rect x="68" y="22" width="44" height="26" rx="1" />
    <line x1="68" y1="31" x2="112" y2="31" />
    <line x1="68" y1="40" x2="112" y2="40" />
    <line x1="83" y1="22" x2="83" y2="48" />
    <line x1="97" y1="22" x2="97" y2="48" />
    {/* Panel stand right */}
    <line x1="83" y1="48" x2="79" y2="58" />
    <line x1="97" y1="48" x2="101" y2="58" />
    {/* Sun */}
    <circle cx="60" cy="12" r="6" />
    <line x1="60" y1="2" x2="60" y2="4" />
    <line x1="60" y1="20" x2="60" y2="22" />
    <line x1="50" y1="12" x2="48" y2="12" />
    <line x1="72" y1="12" x2="70" y2="12" />
    <line x1="53" y1="5" x2="51.5" y2="3.5" />
    <line x1="67" y1="19" x2="68.5" y2="20.5" />
    <line x1="67" y1="5" x2="68.5" y2="3.5" />
    <line x1="53" y1="19" x2="51.5" y2="20.5" />
    {/* Cloud */}
    <path d="M10,18 Q12,12 18,14 Q19,8 26,10 Q30,6 35,10 Q40,8 41,14 Q46,14 44,18 Z" />
  </svg>
)

const ShieldIllustration = () => (
  <svg viewBox="0 0 120 70" fill="none" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full opacity-[0.15]">
    {/* Shield */}
    <path d="M60,8 L82,18 L82,38 Q82,54 60,62 Q38,54 38,38 L38,18 Z" />
    {/* Checkmark inside shield */}
    <polyline points="48,38 56,46 72,30" strokeWidth="1.5" />
    {/* Stars */}
    <line x1="20" y1="20" x2="20" y2="24" /><line x1="18" y1="22" x2="22" y2="22" />
    <line x1="100" y1="15" x2="100" y2="19" /><line x1="98" y1="17" x2="102" y2="17" />
    <line x1="15" y1="45" x2="15" y2="49" /><line x1="13" y1="47" x2="17" y2="47" />
    <line x1="105" y1="40" x2="105" y2="44" /><line x1="103" y1="42" x2="107" y2="42" />
    {/* Ground line */}
    <line x1="0" y1="66" x2="120" y2="66" />
  </svg>
)

const GridIllustration = () => (
  <svg viewBox="0 0 120 70" fill="none" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full opacity-[0.15]">
    {/* House */}
    <polyline points="18,38 30,26 42,38" />
    <rect x="20" y="38" width="20" height="18" />
    <rect x="27" y="46" width="6" height="10" />
    {/* Solar panel on house */}
    <rect x="22" y="30" width="16" height="8" />
    <line x1="22" y1="34" x2="38" y2="34" />
    <line x1="30" y1="30" x2="30" y2="38" />
    {/* Wind turbine */}
    <line x1="85" y1="56" x2="85" y2="20" />
    <ellipse cx="85" cy="20" rx="2" ry="2" />
    <line x1="85" y1="18" x2="78" y2="8" />
    <line x1="83" y1="21" x2="73" y2="26" />
    <line x1="87" y1="21" x2="97" y2="16" />
    {/* Battery */}
    <rect x="52" y="28" width="20" height="30" rx="2" />
    <rect x="58" y="25" width="8" height="4" rx="1" />
    <line x1="52" y1="38" x2="72" y2="38" />
    <line x1="60" y1="42" x2="60" y2="50" />
    <line x1="56" y1="46" x2="64" y2="46" />
    {/* EV Car */}
    <rect x="92" y="42" width="24" height="12" rx="3" />
    <rect x="95" y="38" width="18" height="6" rx="2" />
    <circle cx="97" cy="56" r="3" />
    <circle cx="113" cy="56" r="3" />
    {/* Ground */}
    <line x1="0" y1="62" x2="120" y2="62" />
  </svg>
)

const MagnifyIllustration = () => (
  <svg viewBox="0 0 120 70" fill="none" stroke="#000000" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full opacity-[0.15]">
    {/* Magnifying glass */}
    <circle cx="52" cy="32" r="20" />
    <line x1="66" y1="46" x2="78" y2="58" strokeWidth="2.5" />
    {/* Solar panel inside glass */}
    <rect x="38" y="24" width="28" height="16" rx="1" />
    <line x1="38" y1="29" x2="66" y2="29" />
    <line x1="38" y1="35" x2="66" y2="35" />
    <line x1="48" y1="24" x2="48" y2="40" />
    <line x1="57" y1="24" x2="57" y2="40" />
    {/* Sun above */}
    <circle cx="52" cy="16" r="4" />
    <line x1="52" y1="10" x2="52" y2="11.5" />
    <line x1="58" y1="16" x2="59.5" y2="16" />
    <line x1="46" y1="16" x2="44.5" y2="16" />
    {/* Sparkles */}
    <line x1="20" y1="18" x2="20" y2="22" /><line x1="18" y1="20" x2="22" y2="20" />
    <line x1="100" y1="25" x2="100" y2="29" /><line x1="98" y1="27" x2="102" y2="27" />
    <line x1="95" y1="50" x2="95" y2="54" /><line x1="93" y1="52" x2="97" y2="52" />
    {/* Ground */}
    <line x1="0" y1="66" x2="120" y2="66" />
  </svg>
)

const _illustrations = [PanelIllustration, ShieldIllustration, GridIllustration, MagnifyIllustration]

const stats = [
  { value: 100, suffix: '+', label: 'Mutlu Müşteri', sub: 'tamamlanan proje' },
  { value: 25, suffix: ' Yıl', label: 'Panel Garantisi', sub: 'üretici garantisi' },
  { value: 4, suffix: '', label: 'Hizmet Alanı', sub: 'farklı çözüm' },
]

function Counter({ value, suffix }) {
  const [count, setCount] = useState(0)
  const ref = useRef()
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1800
          const start = performance.now()
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * value))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref} className="text-4xl sm:text-5xl font-bold text-[#448834] font-['Rajdhani']">
      {count}{suffix}
    </span>
  )
}

export default function Stats() {
  return (
    <section className="relative z-10 -mt-24 pb-6 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
          {/* Background image */}
          <div className="absolute inset-0 pointer-events-none">
            <img src="/stats-bg.webp" alt="" className="w-full h-full object-cover opacity-35" width="1440" height="200" loading="lazy" />
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3">
            {stats.map(({ value, suffix, label, sub }, i) => (
              <div
                key={label}
                className="px-8 py-7 text-center relative"
              >
                {i < stats.length - 1 && (
                  <div className="absolute right-0 top-5 bottom-5 w-px bg-gray-400 hidden sm:block" />
                )}
                <Counter value={value} suffix={suffix} />
                <p className="text-gray-800 font-bold mt-1 text-sm">{label}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
