import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Clock, Inbox, MessageCircle, Phone, PhoneCall, Trash2, Trophy, XCircle } from 'lucide-react'
import { fetchQuoteRequests, updateQuoteStatus, deleteQuoteRequest } from '../../api/admin'
import { dayRangeToIso, formatDateTime } from '../../lib/date'
import { applyPagedResult } from '../../lib/adminPaging'
import { useLatestFetch } from '../../hooks/useLatestFetch'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import AdminPager from '../../components/AdminPager'
import AdminDateRange from '../../components/AdminDateRange'
import AdminStatCard from '../../components/AdminStatCard'
import AdminTabs from '../../components/AdminTabs'

const SERVICE_LABELS = {
  'cati-ges': 'Çatı Tipi GES',
  'tarimsal-sulama': 'Tarımsal Sulama GES',
  'ev-sarj': 'EV Şarj İstasyonu',
  diger: 'Diğer',
}

const STATUS_META = {
  new: { label: 'Yeni', icon: Clock, className: 'text-amber-600' },
  contacted: { label: 'İletişime Geçildi', icon: PhoneCall, className: 'text-blue-600' },
  won: { label: 'Kazanıldı', icon: Trophy, className: 'text-green-600' },
  lost: { label: 'Kaybedildi', icon: XCircle, className: 'text-gray-400' },
}

const STATUS_TABS = [
  { id: 'all', label: 'Tümü' },
  { id: 'new', label: 'Yeni' },
  { id: 'contacted', label: 'İletişime Geçildi' },
  { id: 'won', label: 'Kazanıldı' },
  { id: 'lost', label: 'Kaybedildi' },
]

function formatPhone(phone) {
  // "905543796004" -> "0554 379 60 04"
  if (!phone || phone.length !== 12) return phone
  const local = '0' + phone.slice(2)
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7, 9)} ${local.slice(9, 11)}`
}

function RequestRow({ request, onStatusChange, onDelete, deleting }) {
  const meta = STATUS_META[request.status] ?? STATUS_META.new
  const StatusIcon = meta.icon

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p className="font-semibold text-gray-900">{request.name ?? '(anonimleştirildi)'}</p>
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
              {SERVICE_LABELS[request.serviceType] ?? request.serviceType}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
            {request.phone && (
              <a href={`tel:+${request.phone}`} className="flex items-center gap-1.5 hover:text-[#448834] transition-colors">
                <Phone size={13} /> {formatPhone(request.phone)}
              </a>
            )}
            {request.city && <span>{request.city}</span>}
            {request.monthlyBill != null && <span>{request.monthlyBill.toLocaleString('tr-TR')} TL/ay</span>}
          </div>
          {request.message && (
            <p className="flex items-start gap-1.5 text-sm text-gray-500 mt-2">
              <MessageCircle size={14} className="text-gray-300 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{request.message}</span>
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">{formatDateTime(request.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={request.status}
              onChange={e => onStatusChange(request.id, e.target.value)}
              className={`appearance-none pl-7 pr-7 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#448834]/30 ${meta.className}`}
            >
              {Object.entries(STATUS_META).map(([value, m]) => (
                <option key={value} value={value}>{m.label}</option>
              ))}
            </select>
            <StatusIcon size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${meta.className}`} />
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
          <button
            onClick={() => onDelete(request.id)}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
            aria-label="Talebi sil"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeklifTalepleri() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [fromDay, setFromDay] = useState('')
  const [toDay, setToDay] = useState('')
  // Silme/durum-güncelleme hatası sonrası listeyi yeniden çekmek için: sayı
  // arttırmak effect'i yeniden tetikler, effect ise her zaman GÜNCEL
  // status/page/tarih filtresini okur. (Handler'ın kendi fetch'ini atması
  // yerine bu yaklaşım tercih edildi: handler'daki bir fetch, `await`
  // sonrası closure'da BAYAT bir filtre değeriyle dispatch edilebiliyor ve
  // araya giren bir filtre değişikliğinin güncel verisini ezebiliyordu.)
  const [refreshTick, setRefreshTick] = useState(0)
  const dataFetch = useLatestFetch()

  function handleFetchError(err) {
    if (err.status === 401) {
      logout()
      navigate('/rnl-panel/login')
    }
  }

  function query() {
    return {
      page,
      status: status === 'all' ? undefined : status,
      ...dayRangeToIso(fromDay, toDay),
    }
  }

  useEffect(() => {
    const seq = dataFetch.next()
    fetchQuoteRequests(query())
      .then(result => {
        if (!dataFetch.isCurrent(seq)) return
        applyPagedResult(result.requests, result, setPage, setData)
      })
      .catch(err => { if (dataFetch.isCurrent(seq)) handleFetchError(err) })
      .finally(() => {
        if (!dataFetch.isCurrent(seq)) return
        setLoading(false)
        setDeletingId(null) // refreshTick bir silmeden geldiyse, buton ancak taze veri gelince tekrar etkinleşir
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, fromDay, toDay, refreshTick])

  function changeStatus(next) {
    setStatus(next)
    setPage(1)
  }

  function changeDates(nextFrom, nextTo) {
    setFromDay(nextFrom)
    setToDay(nextTo)
    setPage(1)
  }

  async function handleStatusChange(id, nextStatus) {
    // İyimser güncelleme: liste anında yansır, hata olursa yeniden çekilir
    setData(prev => ({
      ...prev,
      requests: prev.requests.map(r => (r.id === id ? { ...r, status: nextStatus } : r)),
    }))
    try {
      await updateQuoteStatus(id, nextStatus)
    } catch (err) {
      alert('Durum güncellenemedi: ' + err.message)
      setRefreshTick(t => t + 1)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteQuoteRequest(id)
      setRefreshTick(t => t + 1) // deletingId, tetiklenen refetch effect'te temizlenir
    } catch (err) {
      alert('Silinemedi: ' + err.message)
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      </main>
    )
  }

  const stats = data?.stats ?? { total: 0, new: 0, contacted: 0, won: 0, lost: 0 }
  const requests = data?.requests ?? []

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Teklif Talepleri</h1>
        <p className="text-sm text-gray-400 mt-0.5">{stats.total} talep · "Ücretsiz Teklif Al" formundan gelenler</p>
      </div>

      {stats.total === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Inbox size={36} className="mx-auto mb-3 text-gray-300" />
          <p>Henüz teklif talebi yok.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <AdminStatCard label="Toplam" value={stats.total} icon={Inbox} dense />
            <AdminStatCard label="Yeni" value={stats.new} icon={Clock} dense />
            <AdminStatCard label="İletişimde" value={stats.contacted} icon={PhoneCall} dense />
            <AdminStatCard label="Kazanıldı" value={stats.won} icon={Trophy} dense />
            <AdminStatCard label="Kaybedildi" value={stats.lost} icon={XCircle} dense />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <AdminTabs items={STATUS_TABS} value={status} onChange={changeStatus} size="sm" wrap />
            <AdminDateRange from={fromDay} to={toDay} onChange={changeDates} />
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>Filtreyle eşleşen talep yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(r => (
                <RequestRow
                  key={r.id}
                  request={r}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  deleting={deletingId === r.id}
                />
              ))}
            </div>
          )}

          <AdminPager page={data?.page ?? 1} pageCount={data?.pageCount ?? 1} onChange={setPage} />
        </>
      )}
    </main>
  )
}
