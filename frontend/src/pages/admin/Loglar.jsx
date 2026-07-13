import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScrollText, AlertCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { fetchLogs } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import AdminPager from '../../components/AdminPager'

function formatDate(value) {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatCard(props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{props.label}</span>
        <props.icon size={14} className="text-gray-300" />
      </div>
      <p className="text-3xl font-bold text-gray-900 font-['Rajdhani']">{props.value}</p>
    </div>
  )
}

function LevelBadge({ level }) {
  return level === 'error' ? (
    <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full shrink-0">HATA</span>
  ) : (
    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">UYARI</span>
  )
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = log.message.length > 140

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => isLong && setExpanded(e => !e)}
        className={`w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-4 text-left ${isLong ? '' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <LevelBadge level={log.level} />
          {log.context && (
            <span className="text-xs font-mono text-gray-400 shrink-0">[{log.context}]</span>
          )}
          <span className={`text-sm text-gray-700 min-w-0 ${expanded ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
            {log.message}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <span className="text-xs text-gray-400">{formatDate(log.createdAt)}</span>
          {isLong && (
            <ChevronDown
              size={16}
              className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>
    </div>
  )
}

export default function Loglar() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('all') // 'all' | 'error' | 'warn'
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetchLogs(level === 'all' ? undefined : level, page)
      .then(setData)
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout()
          navigate('/admin/login')
        }
      })
      .finally(() => setLoading(false))
  }, [level, page]) // eslint-disable-line react-hooks/exhaustive-deps

  function changeLevel(next) {
    setLevel(next)
    setPage(1) // filtre değişince ilk sayfaya dön
  }

  const stats = data?.stats ?? { total: 0, errors24h: 0, warns24h: 0 }
  const logs = data?.logs ?? []

  if (loading && !data) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Loglar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Backend hata ve uyarıları · sayfa başına 50 kayıt · 30 gün saklanır
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'error', label: 'Hata' },
            { id: 'warn', label: 'Uyarı' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => changeLevel(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                level === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Toplam Kayıt" value={stats.total} icon={ScrollText} />
        <StatCard label="Son 24s Hata" value={stats.errors24h} icon={AlertCircle} />
        <StatCard label="Son 24s Uyarı" value={stats.warns24h} icon={AlertTriangle} />
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ScrollText size={36} className="mx-auto mb-3 text-gray-300" />
          <p>Kayıt yok — her şey yolunda görünüyor.</p>
          <p className="text-xs mt-1">Backend'de hata veya uyarı oluşunca burada görünür.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {logs.map(l => (
              <LogRow key={l.id} log={l} />
            ))}
          </div>
          <AdminPager
            page={data?.page ?? 1}
            pageCount={data?.pageCount ?? 1}
            onChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </main>
  )
}
