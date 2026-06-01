import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, FolderOpen, Star, Plus, SunMedium, Handshake, TrendingUp, Wind, Droplets, Thermometer } from 'lucide-react'
import { fetchAllProjects, fetchAllReferences } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

const API = import.meta.env.VITE_API_URL || ''

function estimateProduction(data) {
  if (!data) return { wPerKwp: 0, rate: 0, label: 'Veri yok', color: 'bg-gray-200', text: 'text-gray-400' }

  const now = data.dt
  const sunrise = data.sys?.sunrise
  const sunset = data.sys?.sunset

  if (!sunrise || !sunset || now < sunrise || now > sunset) {
    return { wPerKwp: 0, rate: 0, label: 'Gece — Üretim Yok', color: 'bg-gray-200', text: 'text-gray-400' }
  }

  // Güneş pozisyonu — öğlen = 1.0, doğuş/batış = 0
  const solarNoon = sunrise + (sunset - sunrise) / 2
  const halfDay = (sunset - sunrise) / 2
  const solarFactor = Math.max(0, Math.cos(((now - solarNoon) / halfDay) * (Math.PI / 2)))

  // Kasten bulut zayıflaması: 1 - 0.75 × (bulut/100)^3.4
  const cloudFraction = (data.clouds?.all ?? 0) / 100
  const cloudAttenuation = 1 - 0.75 * Math.pow(cloudFraction, 3.4)

  // Sıcaklık düzeltmesi: 25°C üzeri her derece için %0.4 kayıp
  const temp = data.main?.temp ?? 25
  const tempFactor = temp > 25 ? 1 - 0.004 * (temp - 25) : 1

  const rate = Math.min(1, solarFactor * cloudAttenuation * tempFactor)
  const pct = Math.round(rate * 100)
  // 1 kWp standart koşulda 1000 W üretir → anlık W/kWp
  const wPerKwp = Math.round(rate * 1000)

  let label, color, text
  if (pct >= 80) { label = 'Tam Verimli'; color = 'bg-green-400'; text = 'text-green-500' }
  else if (pct >= 55) { label = 'Verimli'; color = 'bg-green-300'; text = 'text-green-400' }
  else if (pct >= 30) { label = 'Orta Verimli'; color = 'bg-amber-400'; text = 'text-amber-500' }
  else if (pct >= 10) { label = 'Düşük Verim'; color = 'bg-orange-400'; text = 'text-orange-500' }
  else { label = 'Minimal Verim'; color = 'bg-red-400'; text = 'text-red-400' }

  return { wPerKwp, rate: pct, label, color, text }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [projects, setProjects] = useState([])
  const [refs, setRefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState({})

  useEffect(() => {
    Promise.all([fetchAllProjects(), fetchAllReferences()])
      .then(([p, r]) => { setProjects(p); setRefs(r) })
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout()
          navigate('/admin/login')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (projects.length === 0) return
    const cities = [...new Set(projects.map((p) => p.location?.split(/[\/,]/)[0].trim()).filter(Boolean))]
    Promise.all(
      cities.map((city) =>
        fetch(`${API}/api/weather?city=${encodeURIComponent(city)}`, { credentials: 'include' })
          .then((r) => r.json())
          .then((data) => ({ city, data }))
          .catch(() => ({ city, data: null }))
      )
    ).then((results) => {
      const map = {}
      results.forEach(({ city, data }) => { map[city] = data })
      setWeather(map)
    })
  }, [projects])

  const publishedProjects = projects.filter((p) => p.published)
  const publishedRefs = refs.filter((r) => r.published)
  const totalKw = projects.reduce((s, p) => s + parseFloat(p.kw || 0), 0)
  const totalKwStr = totalKw % 1 === 0 ? totalKw : totalKw.toFixed(1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-[#448834] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Hero Banner — tam genişlik */}
      <div className="relative overflow-hidden w-full flex items-center justify-center py-8"
        style={{ backgroundImage: 'url(/adminbanner.webp)', backgroundSize: 'cover', backgroundPosition: 'center 85%' }}>
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 text-center">
          <p className="text-white/70 text-lg mb-2 drop-shadow-md tracking-widest uppercase">Yönetim Paneli</p>
          <h1 className="text-white text-6xl font-bold drop-shadow-lg">Hoş geldiniz</h1>
          <p className="text-white/60 text-xl mt-3 drop-shadow-md">RenEl Enerji Mühendislik</p>
        </div>
      </div>

    <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

      {/* İstatistik Kartı */}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
          <FolderOpen size={14} className="text-[#448834]" />
          Genel İstatistikler
        </p>
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden flex items-center">
        <img src="/statsbanner.webp" alt="" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[25%] w-full h-auto opacity-10 pointer-events-none" />
        <div className="relative flex-1 px-7 py-6 overflow-hidden">
          <div className="relative z-10">
            <p className="text-5xl font-bold text-[#448834] font-['Rajdhani'] drop-shadow-sm">{projects.length}</p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Toplam Proje</p>
            {projects.length - publishedProjects.length > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{projects.length - publishedProjects.length} gizli</p>
            )}
          </div>
        </div>

        <div className="w-0.5 bg-gray-400 self-stretch my-4 rounded-full" />

        <div className="relative flex-1 px-7 py-6 overflow-hidden">
          <div className="relative z-10">
            <p className="text-5xl font-bold text-[#448834] font-['Rajdhani'] drop-shadow-sm">{refs.length}</p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Toplam Referans</p>
            {refs.length - publishedRefs.length > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">{refs.length - publishedRefs.length} gizli</p>
            )}
          </div>
        </div>

        <div className="w-0.5 bg-gray-400 self-stretch my-4 rounded-full" />

        <div className="relative flex-1 px-7 py-6 overflow-hidden">
          <div className="relative z-10">
            <p className="text-5xl font-bold text-[#448834] font-['Rajdhani'] drop-shadow-sm">
              {totalKwStr} <span className="text-base font-semibold text-gray-400">kW</span>
            </p>
            <p className="text-base text-gray-400 mt-0.5 drop-shadow-sm">Kurulu Güç</p>
          </div>
        </div>
      </div>
      </div>


      {/* Hızlı Aksiyonlar */}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
          <Zap size={14} className="text-[#448834]" />
          Hızlı İşlemler
        </p>
      <div className="grid grid-cols-3 gap-4">
        <Link
          to="/admin/projeler/yeni"
          className="group relative bg-white hover:bg-gray-50 rounded-2xl overflow-hidden flex items-center px-6 py-5 min-h-[90px] transition-all duration-200 border border-gray-100 border-l-4 border-l-[#448834] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="/yeni_proje.webp" alt="" className="absolute w-44 h-44 object-contain shrink-0 opacity-10" style={{ right: -30, bottom: -47 }} />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-gray-800 font-bold text-base">Yeni Proje</p>
              <Plus size={16} className="text-gray-800" />
            </div>
            <p className="text-gray-400 text-sm mt-0.5">Ekle ve yayınla</p>
          </div>
        </Link>

        <Link
          to="/admin/referanslar/yeni"
          className="group relative bg-white hover:bg-gray-50 rounded-2xl overflow-hidden flex items-center px-6 py-5 min-h-[90px] transition-all duration-200 border border-gray-100 border-l-4 border-l-[#448834] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="/yeni_referans.webp" alt="" className="absolute w-36 h-36 object-contain shrink-0 opacity-10" style={{ right: -25, bottom: -30 }} />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-gray-800 font-bold text-base">Yeni Referans</p>
              <Plus size={16} className="text-gray-800" />
            </div>
            <p className="text-gray-400 text-sm mt-0.5">Logo ekle</p>
          </div>
        </Link>

        <Link
          to="/admin/analitik"
          className="group relative bg-white hover:bg-gray-50 rounded-2xl overflow-hidden flex items-center px-6 py-5 min-h-[90px] transition-all duration-200 border border-gray-100 border-l-4 border-l-[#448834] shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          <img src="/analitik_banner.webp" alt="" className="absolute w-36 h-36 object-contain shrink-0 opacity-10" style={{ right: -25, bottom: -35 }} />
          <div className="relative z-10">
            <p className="text-gray-800 font-bold text-base">Analitik</p>
            <p className="text-gray-400 text-sm mt-0.5">Ziyaret istatistikleri</p>
          </div>
        </Link>
      </div>
      </div>

      {/* Hava Durumu & Üretim Tahmini */}
      {Object.keys(weather).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <Zap size={14} className="text-[#448834]" />
            Proje Lokasyonları — Anlık Hava & Tahmini Üretim
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(weather).map(([city, data]) => {
              if (!data || data.cod !== 200) return (
                <div key={city} className="bg-white rounded-2xl border border-gray-100 px-6 py-6 shadow-md">
                  <p className="text-base font-semibold text-gray-700 truncate">{city}</p>
                  <p className="text-sm text-gray-300 mt-1">Veri alınamadı</p>
                </div>
              )
              const prod = estimateProduction(data)
              return (
                <div key={city} className="bg-white rounded-2xl border border-gray-100 px-6 py-6 shadow-md flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-gray-700 truncate">{city}</p>
                    <img
                      src={`https://openweathermap.org/img/wn/${data.weather[0]?.icon}@2x.png`}
                      alt=""
                      className="w-12 h-12 -my-1"
                    />
                  </div>
                  <p className="text-sm text-gray-400 capitalize -mt-2">{data.weather[0]?.description}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Thermometer size={13} /> {Math.round(data.main.temp)}°C</span>
                    <span className="flex items-center gap-1"><Droplets size={13} /> %{data.main.humidity}</span>
                    <span className="flex items-center gap-1"><Wind size={13} /> {Math.round(data.wind.speed)} m/s</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className={`font-medium ${prod.text}`}>{prod.label}</span>
                      <span className="text-gray-400">~{prod.wPerKwp} W/kWp</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${prod.color}`} style={{ width: `${prod.rate}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
    </div>
  )
}
