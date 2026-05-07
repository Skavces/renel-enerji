import { useEffect, useState } from 'react'
import { Users, Eye, MousePointer, Clock, ExternalLink, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
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

const PAGE_COLORS = ['#448834', '#f97316', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

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

export default function Analitik() {
  const [rangeIdx, setRangeIdx] = useState(1)
  const [stats, setStats] = useState(null)
  const [pageviews, setPageviews] = useState(null)
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (idx = rangeIdx) => {
    setLoading(true)
    setError(null)
    const range = RANGES[idx]
    const startAt = range.startAt()
    const endAt = range.endAt()
    try {
      const [s, pv, pg] = await Promise.all([
        fetch(`${API}/api/analytics/stats?startAt=${startAt}&endAt=${endAt}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/analytics/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${range.unit}`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/api/analytics/pages?startAt=${startAt}&endAt=${endAt}`, { headers: authHeaders() }).then(r => r.json()),
      ])
      setStats(s)
      setPageviews(pv)
      setPages(Array.isArray(pg) ? pg : [])
    } catch (e) {
      setError('Umami verisi alınamadı. Backend çalışıyor mu?')
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
          {/* Range seçici */}
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
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4 text-sm">
          {error}
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : (
        <>
          {/* Stat kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Sayfa Görüntülenme', value: stats?.pageviews?.value ?? 0, icon: Eye, color: 'bg-blue-50 text-blue-600' },
              { label: 'Tekil Ziyaretçi', value: stats?.visitors?.value ?? 0, icon: Users, color: 'bg-green-50 text-green-600' },
              { label: 'Oturum', value: stats?.visits?.value ?? 0, icon: MousePointer, color: 'bg-orange-50 text-orange-600' },
              { label: 'Ort. Oturum Süresi', value: stats?.totaltime?.value ? `${Math.round(stats.totaltime.value / 60 / (stats.visits?.value || 1))}dk` : '0dk', icon: Clock, color: 'bg-purple-50 text-purple-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</span>
                  <div className={`p-2 rounded-lg ${s.color}`}><s.icon size={14} /></div>
                </div>
                <p className="text-3xl font-bold text-gray-900 font-['Rajdhani']">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Alan grafik — ziyaret trendi */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 text-sm mb-5">Ziyaret Trendi</h3>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Veri yok</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#448834" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#448834" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Sayfa Görüntülenme" stroke="#448834" strokeWidth={2} fill="url(#pvGrad)" dot={false} />
                  <Area type="monotone" dataKey="Ziyaretçi" stroke="#f97316" strokeWidth={2} fill="url(#sesGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* En çok görüntülenen sayfalar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 text-sm mb-5">En Çok Görüntülenen Sayfalar</h3>
            {pages.length === 0 ? (
              <div className="text-center py-8 text-gray-300 text-sm">Veri yok</div>
            ) : (
              <div className="space-y-3">
                {pages.slice(0, 8).map((p, i) => (
                  <div key={p.x} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-4 shrink-0 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate">{p.x}</span>
                        <span className="text-sm font-semibold text-gray-900 ml-3 shrink-0">{p.y}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(p.y / maxPages) * 100}%`, backgroundColor: PAGE_COLORS[i % PAGE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
