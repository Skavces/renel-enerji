import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { fetchProjects, mediaUrl } from '../api/projects'

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (projects.length < 2) return
    const interval = setInterval(() => {
      setCurrent(i => (i + 1) % projects.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [projects.length])

  const project = projects[current]

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden -mt-24">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/hero.webp"
          alt="Güneş enerjisi"
          className="w-full h-full object-cover"
          width="1672"
          height="941"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/25 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 pt-[100px] sm:pt-[132px] lg:pt-[164px] pb-24 w-full flex items-center justify-between gap-8 xl:gap-12">

        {/* Left — text */}
        <div className="w-full max-w-xl min-w-0">
          <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-7xl font-bold text-white leading-[1.05] mb-5 sm:mb-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
            Şebekeden<br />
            <span className="text-[#f5ce31]">Güneşe,</span><br />
            Gücün Her<br />
            <span className="text-[#f5ce31]">Noktasında.</span>
          </h1>

          <p className="text-white/75 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 max-w-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            Tarımsal sulamadan çatı tipi sistemlere, depolamalı kurulumlardan EV şarj istasyonlarına kadar
            güneş enerjisinde tam kapsamlı mühendislik hizmeti.
          </p>

          <Link
            to="/projelerimiz"
            className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-colors shadow-lg shadow-black/30"
          >
            Projelerimizi Gör
            <ArrowRight size={17} />
          </Link>
        </div>

        {/* Right — auto-rotating project card */}
        {projects.length > 0 && project && (
          <div className="hidden lg:block shrink-0 w-[300px] xl:w-[400px] border-2 border-[#f5ce31]/60 rounded-3xl p-3">
            <p className="text-white/80 text-sm font-semibold mb-3">
              Son Projeler
            </p>
            <Link to={`/projelerimiz/${project.slug}`} className="group block relative rounded-2xl overflow-hidden aspect-3/4">
              {projects.map((p, i) => {
                const cover = p.media?.find(m => m.type === 'image')
                return cover ? (
                  <img
                    key={p.id}
                    src={mediaUrl(cover.src)}
                    alt={`${p.name} - ${p.location} güneş enerjisi sistemi kurulumu`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
                  />
                ) : null
              })}
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
              {projects.map((p, i) => (
                <div
                  key={p.id}
                  className={`absolute bottom-0 left-0 right-0 p-5 transition-opacity duration-1000 ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
                >
                  <p className="text-white font-bold text-base leading-tight">{p.name}</p>
                  <p className="text-[#f5ce31] font-bold text-xl font-['Rajdhani'] mt-1">{p.kw} kW</p>
                </div>
              ))}
              <div className="absolute top-3 right-3 flex gap-1.5">
                {projects.map((_, i) => (
                  <span key={i} className={`block rounded-full transition-all duration-500 ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
                ))}
              </div>
            </Link>
          </div>
        )}
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
