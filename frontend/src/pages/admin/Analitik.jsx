import { useEffect, useState } from 'react'
import { Users, Eye, MousePointer, Clock, ExternalLink, RefreshCw, Globe, Monitor, Smartphone, Link2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || ''
const UMAMI_URL = import.meta.env.VITE_UMAMI_URL || 'http://localhost:3002'

function getToken() {
  return localStorage.getItem('admin_token')
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` }
}

function startOfDay(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const RANGES = [
  { label: 'Bugün', startAt: () => startOfDay(0), endAt: () => Date.now(), unit: 'hour' },
  { label: '7 Gün', startAt: () => startOfDay(6), endAt: () => Date.now(), unit: 'day' },
  { label: '30 Gün', startAt: () => startOfDay(29), endAt: () => Date.now(), unit: 'day' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function MetricList({ title, icon: Icon, items, emptyText }) {
  const max = items[0]?.y || 1
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={13} className="text-gray-300" />
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-center py-6 text-gray-300 text-sm">{emptyText || 'Veri yok'}</p>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 6).map((item) => (
            <div key={item.x} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{item.x || 'Doğrudan'}</span>
              <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-[#448834] rounded-full"
                  style={{ width: `${(item.y / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-5 text-right shrink-0">{item.y}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Analitik() {
  const [rangeIdx, setRangeIdx] = useState(1)
  const [stats, setStats] = useState(null)
  const [pageviews, setPageviews] = useState(null)
  const [pages, setPages] = useState([])
  const [browsers, setBrowsers] = useState([])
  const [devices, setDevices] = useState([])
  const [os, setOs] = useState([])
  const [referrers, setReferrers] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (idx = rangeIdx) => {
    setLoading(true)
    setError(null)
    const range = RANGES[idx]
    const startAt = range.startAt()
    const endAt = range.endAt()
    try {
      const fetcher = (url) =>
        fetch(url, { headers: authHeaders() }).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
      const q = `startAt=${startAt}&endAt=${endAt}`
      const [s, pv, pg, br, dv, oss, ref, ctr] = await Promise.all([
        fetcher(`${API}/api/dash/stats?${q}`),
        fetcher(`${API}/api/dash/pageviews?${q}&unit=${range.unit}`),
        fetcher(`${API}/api/dash/pages?${q}`),
        fetcher(`${API}/api/dash/metrics?${q}&type=browser`),
        fetcher(`${API}/api/dash/metrics?${q}&type=device`),
        fetcher(`${API}/api/dash/metrics?${q}&type=os`),
        fetcher(`${API}/api/dash/metrics?${q}&type=referrer`),
        fetcher(`${API}/api/dash/metrics?${q}&type=country`),
      ])
      setStats(s)
      setPageviews(pv)
      setPages(Array.isArray(pg) ? pg : [])
      setBrowsers(Array.isArray(br) ? br : [])
      setDevices(Array.isArray(dv) ? dv : [])
      setOs(Array.isArray(oss) ? oss : [])
      setReferrers(Array.isArray(ref) ? ref : [])
      setCountries(Array.isArray(ctr) ? ctr : [])
    } catch (e) {
      if (e.message.includes('401')) {
        setError('Oturum süresi dolmuş. Yeniden giriş yapın.')
      } else if (e.message.includes('500')) {
        setError('Umami bağlantısı kurulamadı. Docker çalışıyor mu? (localhost:3002)')
      } else {
        setError(`Veri alınamadı: ${e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(rangeIdx) }, [rangeIdx])

  const chartData = pageviews?.pageviews?.map((pv, i) => ({
    t: pv.x,
    'Sayfa Görüntülenme': pv.y,
    'Ziyaretçi': pageviews?.sessions?.[i]?.y ?? 0,
  })) ?? []

  const maxPages = pages[0]?.y || 1

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analitik</h2>
          <p className="text-sm text-gray-400 mt-1">Site ziyaretçi istatistikleri</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRangeIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  rangeIdx === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(rangeIdx)}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <a
            href={UMAMI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ExternalLink size={13} />
            Umami'de Aç
          </a>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm">{error}</div>
      ) : loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : (
        <div className="space-y-6">

          {/* Stat kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Sayfa Görüntülenme', value: stats?.pageviews?.value ?? stats?.pageviews ?? 0, icon: Eye },
              { label: 'Tekil Ziyaretçi', value: stats?.visitors?.value ?? stats?.visitors ?? 0, icon: Users },
              { label: 'Oturum', value: stats?.visits?.value ?? stats?.visits ?? 0, icon: MousePointer },
              { label: 'Ort. Süre', value: (() => { const t = stats?.totaltime?.value ?? stats?.totaltime ?? 0; const v = stats?.visits?.value ?? stats?.visits ?? 1; return t ? `${Math.round(t / 60 / v)}dk` : '0dk' })(), icon: Clock },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{s.label}</span>
                  <s.icon size={14} className="text-gray-300" />
                </div>
                <p className="text-3xl font-bold text-gray-900 font-['Rajdhani']">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Ziyaret trendi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 text-sm mb-5">Ziyaret Trendi</h3>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#448834" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#448834" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Sayfa Görüntülenme" stroke="#448834" strokeWidth={1.5} fill="url(#pvGrad)" dot={false} />
                  <Area type="monotone" dataKey="Ziyaretçi" stroke="#cbd5e1" strokeWidth={1.5} fill="url(#sesGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sayfalar + Kaynaklar */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* En çok görüntülenen sayfalar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">En Çok Görüntülenen Sayfalar</h3>
              {pages.length === 0 ? (
                <p className="text-center py-6 text-gray-300 text-sm">Veri yok</p>
              ) : (
                <div className="space-y-2.5">
                  {pages.slice(0, 8).map((p, i) => (
                    <div key={p.x} className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-4 shrink-0 text-right">{i + 1}</span>
                      <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{p.x}</span>
                      <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div
                          className="h-full bg-[#448834] rounded-full"
                          style={{ width: `${(p.y / maxPages) * 100}%`, opacity: 1 - i * 0.07 }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{p.y}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <MetricList title="Trafik Kaynakları" icon={Link2} items={referrers} emptyText="Kaynak verisi yok" />
          </div>

          {/* Cihaz / Tarayıcı / OS / Ülke */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricList title="Cihazlar" icon={Smartphone} items={devices} />
            <MetricList title="Tarayıcılar" icon={Monitor} items={browsers} />
            <MetricList title="İşletim Sistemi" icon={Monitor} items={os} />
            <MetricList title="Ülkeler" icon={Globe} items={countries} />
          </div>

        </div>
      )}
    </main>
  )
}
