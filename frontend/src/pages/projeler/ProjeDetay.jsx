import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, X, Play, Zap } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { fetchProjectBySlug, mediaUrl } from '../../api/projects'
import SEO from '../../components/SEO'

const WA_NUMBER = '905543796004'
const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`

export default function ProjeDetay() {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    setLoading(true)
    setCurrent(0)
    setLightbox(null)
    fetchProjectBySlug(slug)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <>
        <PageHeader title="Proje Detayı" parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />
        <div className="py-32 text-center text-gray-400">Yükleniyor...</div>
      </>
    )
  }

  if (error || !project) {
    return (
      <>
        <PageHeader title="Proje Bulunamadı" parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />
        <div className="py-32 text-center">
          <p className="text-gray-500 mb-4">Bu proje bulunamadı veya kaldırıldı.</p>
          <Link to="/projelerimiz" className="text-[#448834] font-semibold hover:underline">
            Tüm projelere dön
          </Link>
        </div>
      </>
    )
  }

  const media = [...(project.media || [])].sort((a, b) => b.sortOrder - a.sortOrder)
  const item = media[current] || null

  const prev = () => setCurrent((i) => (i - 1 + media.length) % media.length)
  const next = () => setCurrent((i) => (i + 1) % media.length)
  const lightboxPrev = (e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + media.length) % media.length) }
  const lightboxNext = (e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % media.length) }

  const coverImg = item?.type === 'image' ? `https://renelenerji.com${mediaUrl(item.src)}` : undefined
  const projectDesc = [
    project.location && `${project.location}'da`,
    project.kw && `${project.kw} kWp`,
    project.type,
    'güneş enerjisi projesi.',
    project.description,
  ].filter(Boolean).join(' ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.name,
    description: projectDesc.slice(0, 160),
    image: coverImg,
    url: `https://renelenerji.com/projelerimiz/${slug}`,
    author: { '@type': 'Organization', name: 'RenEL Enerji Mühendislik', url: 'https://renelenerji.com' },
    publisher: { '@type': 'Organization', name: 'RenEL Enerji Mühendislik', url: 'https://renelenerji.com' },
  }

  return (
    <>
      <SEO
        title={project.name}
        description={projectDesc.slice(0, 160)}
        image={coverImg}
        jsonLd={jsonLd}
      />
      <PageHeader title={project.name} parent={{ label: 'Projelerimiz', to: '/projelerimiz' }} />

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-start">

          {/* Gallery */}
          {media.length > 0 && item && (
            <div>
              <div
                className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-4/3 mb-3 group cursor-pointer"
                onClick={() => setLightbox(current)}
              >
                {item.type === 'video' ? (
                  <>
                    <video src={mediaUrl(item.src)} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="bg-white/90 rounded-full p-4 shadow-lg">
                        <Play size={28} className="text-[#448834] ml-1" fill="#448834" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <img src={mediaUrl(item.src)} alt={`${project.name} - ${project.location} güneş enerjisi sistemi kurulumu`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full">Büyüt</span>
                    </div>
                  </>
                )}
                {media.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); prev() }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                      <ArrowLeft size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); next() }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all">
                      <ArrowRight size={16} />
                    </button>
                  </>
                )}
                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  {current + 1} / {media.length}
                </span>
              </div>

              {media.length > 1 && (
                <div className="flex gap-2">
                  {media.map((m, i) => (
                    <button
                      key={m.id || i}
                      onClick={() => setCurrent(i)}
                      className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${i === current ? 'border-[#448834]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      {m.type === 'video' ? (
                        <>
                          <video src={mediaUrl(m.src)} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play size={12} className="text-white" fill="white" />
                          </div>
                        </>
                      ) : (
                        <img src={mediaUrl(m.src)} alt={`${project.name} kurulum fotoğrafı ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="space-y-8">
            {project.about && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Proje Hakkında</h2>
                {project.about.split('\n\n').map((para, i) => (
                  <p key={i} className="text-gray-600 leading-relaxed mt-3 first:mt-0">{para}</p>
                ))}
              </div>
            )}

            {project.specs?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{project.specsTitle}</h2>
                <ul className="space-y-3">
                  {project.specs.map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#448834] shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-medium">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.highlights?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{project.highlightsTitle}</h2>
                <ul className="space-y-3">
                  {project.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Zap size={16} className="text-[#f5ce31] shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.statBoxes?.length > 0 && (
              <div className={`grid gap-3 ${project.statBoxes.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {project.statBoxes.map((box, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-[#448834] font-bold text-2xl font-['Rajdhani']">{box.value}</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">{box.label}</p>
                  </div>
                ))}
              </div>
            )}

            <a
              href={waLink(`Merhaba, ${project.name} projeniz gibi bir proje için teklif almak istiyorum. Detaylı bilgi alabilir miyim?`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#448834] hover:bg-[#357228] text-white font-bold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-[#448834]/25"
            >
              {project.ctaText || 'Benzer Proje İçin Teklif Al'}
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox !== null && media[lightbox] && (
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
              src={mediaUrl(media[lightbox].src)}
              controls
              autoPlay
              className="h-[85vh] max-w-[90vw] w-auto rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={mediaUrl(media[lightbox].src)}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
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
