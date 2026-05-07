import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'

const featuredProjects = [
  {
    name: 'Ahmetli Bağ Sulama',
    kw: '11 kW',
    category: 'Sulama GES',
    photo: '/bag-projesi/SnapInsta.to_658048509_17877068112551552_3955411799585925962_n.webp',
    slug: '/projelerimiz/ahmetli-bag-projesi',
  },
  {
    name: '10,2 kW Hibrit GES',
    kw: '10,2 kW',
    category: 'Depolamalı GES',
    photo: '/hibrit-ges/SnapInsta.to_540529601_17847453474551552_7890774048914980763_n.webp',
    slug: '/projelerimiz/hibrit-ges',
  },
  {
    name: '4 kWp Bağ Evi',
    kw: '4 kWp',
    category: 'Depolamalı GES',
    photo: '/4kwp-bagevi/SnapInsta.to_572962383_17857134906551552_2235488587040886983_n.webp',
    slug: '/projelerimiz/4kwp-bag-evi',
  },
  {
    name: 'Hayvan Çiftliği GES',
    kw: '4,6 kW',
    category: 'Depolamalı GES',
    photo: '/hayvan-ciftligi/SnapInsta.to_581867901_17858371554551552_1664283504094743853_n.webp',
    slug: '/projelerimiz/hayvan-ciftligi',
  },
  {
    name: 'Off-Grid Sistem',
    kw: '3,75 kWp',
    category: 'Off-Grid GES',
    photo: '/off-grid/SnapInsta.to_606030691_17863261425551552_5849723382801399238_n.webp',
    slug: '/projelerimiz/off-grid',
  },
  {
    name: '2,3 kWp Hibrit GES',
    kw: '2,3 kWp',
    category: 'Depolamalı GES',
    photo: '/2,3kWp/SnapInsta.to_567104077_17854973667551552_2686719391728865953_n.webp',
    slug: '/projelerimiz/2-3kwp-hibrit-ges',
  },
  {
    name: 'Şebekesiz Sulama Çözümü',
    kw: '1,1 kWp',
    category: 'Şebekesiz Sulama',
    photo: '/sebekesiz-sulama-cozumu/SnapInsta.to_685360645_17882474067551552_3241083911849974964_n.webp',
    slug: '/projelerimiz/sebekesiz-sulama-cozumu',
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(i => (i + 1) % featuredProjects.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const project = featuredProjects[current]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-24">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/photos/hero.webp"
          alt="Güneş enerjisi"
          className="w-full h-full object-cover animate-[kenburns_18s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/25 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 pt-[164px] pb-24 w-full flex items-center justify-between gap-12">

        {/* Left — text */}
        <div className="max-w-xl shrink-0">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            Şebekeden<br />
            <span className="text-[#f5ce31]">Güneşe,</span><br />
            Gücün Her<br />
            <span className="text-[#f5ce31]">Noktasında.</span>
          </h1>

          <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            Tarımsal sulamadan çatı tipi sistemlere, depolamalı kurulumlardan EV şarj istasyonlarına kadar
            güneş enerjisinde tam kapsamlı mühendislik hizmeti.
          </p>

          <Link
            to="/projelerimiz"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-black/30"
          >
            Projelerimizi Gör
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* Right — auto-rotating project card */}
        <div className="hidden lg:block shrink-0 w-[400px] border-2 border-[#f5ce31]/60 rounded-3xl p-3">
          <p className="text-white/80 text-sm font-semibold mb-3">
            Son Projeler
          </p>
          <Link to={project.slug} className="group block relative rounded-2xl overflow-hidden aspect-3/4">
            {/* Crossfade: all images stacked, only active is visible */}
            {featuredProjects.map((p, i) => (
              <img
                key={p.slug}
                src={p.photo}
                alt={p.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
            {/* Text crossfade */}
            {featuredProjects.map((p, i) => (
              <div
                key={p.slug}
                className={`absolute bottom-0 left-0 right-0 p-5 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
              >
                <p className="text-white/60 text-xs mb-1">{p.category}</p>
                <p className="text-white font-bold text-base leading-tight">{p.name}</p>
                <p className="text-[#f5ce31] font-bold text-xl font-['Rajdhani'] mt-1">{p.kw}</p>
              </div>
            ))}
            {/* Dots */}
            <div className="absolute top-3 right-3 flex gap-1.5">
              {featuredProjects.map((_, i) => (
                <span key={i} className={`block rounded-full transition-all duration-500 ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
              ))}
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none h-20">
        <svg className="absolute bottom-0 w-[200%] h-full animate-[wave_8s_linear_infinite]" viewBox="0 0 2880 80" preserveAspectRatio="none" fill="none">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 C1680,80 1920,0 2160,40 C2400,80 2640,0 2880,40 L2880,80 L0,80 Z" fill="white" fillOpacity="0.4"/>
        </svg>
        <svg className="absolute bottom-0 w-[200%] h-full animate-[wave_5s_linear_infinite]" viewBox="0 0 2880 80" preserveAspectRatio="none" fill="none">
          <path d="M0,55 C240,20 480,70 720,45 C960,20 1200,70 1440,45 C1680,20 1920,70 2160,45 C2400,20 2640,70 2880,45 L2880,80 L0,80 Z" fill="white"/>
        </svg>
      </div>
    </section>
  )
}
