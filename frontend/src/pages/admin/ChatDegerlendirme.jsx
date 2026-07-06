import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronDown, ChevronRight, MessageCircle, Bot, Users, Send, Clock, TrendingUp, Trash2 } from 'lucide-react'
import { fetchChatRatings, fetchChatLeads, fetchChatFunnel, deleteChatLead, deleteChatRating } from '../../api/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

function Stars({ value, size = 15 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          size={size}
          className={star <= value ? 'text-amber-400' : 'text-gray-200'}
          fill={star <= value ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  )
}

function Transcript({ conversation }) {
  return (
    <div className="px-5 pb-4 pt-1 border-t border-gray-50 space-y-2">
      {conversation.map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`max-w-[80%] px-3.5 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-[#448834] text-white rounded-br-sm'
                : 'bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm'
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
    </div>
  )
}

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

function RatingRow({ rating, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const hasConversation = rating.conversation?.length > 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="w-full flex items-center gap-2 pr-3">
        <button
          onClick={() => hasConversation && setExpanded(e => !e)}
          className={`flex-1 min-w-0 flex items-center gap-4 pl-5 py-4 text-left ${hasConversation ? '' : 'cursor-default'}`}
        >
          <Stars value={rating.rating} />
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <MessageCircle size={14} className="text-gray-300" />
            {rating.messageCount} mesaj
          </span>
          <span className="flex-1 text-right text-xs text-gray-400">{formatDate(rating.createdAt)}</span>
          {hasConversation && (
            <ChevronDown
              size={16}
              className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        <button
          onClick={() => onDelete(rating.id)}
          disabled={deleting}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
          aria-label="Değerlendirmeyi sil"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && <Transcript conversation={rating.conversation} />}
    </div>
  )
}

function LeadRow({ lead, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const hasConversation = lead.conversation?.length > 0
  const isWhatsapp = lead.status === 'whatsapp'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="w-full flex items-center gap-2 pr-3">
        <button
          onClick={() => hasConversation && setExpanded(e => !e)}
          className={`flex-1 min-w-0 flex items-center gap-4 pl-5 py-4 text-left ${hasConversation ? '' : 'cursor-default'}`}
        >
          {isWhatsapp ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium shrink-0">
              <Send size={13} /> WhatsApp'a geçti
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-amber-600 font-medium shrink-0">
              <Clock size={13} /> WhatsApp'a geçmedi
            </span>
          )}
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <MessageCircle size={14} className="text-gray-300" />
            {lead.messageCount} mesaj
          </span>
          {lead.rating != null && <Stars value={lead.rating} size={13} />}
          <span className="flex-1 text-right text-xs text-gray-400">{formatDate(lead.updatedAt)}</span>
          {hasConversation && (
            <ChevronDown
              size={16}
              className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        <button
          onClick={() => onDelete(lead.id)}
          disabled={deleting}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 shrink-0"
          aria-label="Talebi sil"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {expanded && <Transcript conversation={lead.conversation} />}
    </div>
  )
}

function percent(part, whole) {
  if (!whole) return '—'
  return `%${Math.round((part / whole) * 100)}`
}

function FunnelSection() {
  const [days, setDays] = useState(30)
  const [funnel, setFunnel] = useState(null)

  useEffect(() => {
    fetchChatFunnel(days).then(setFunnel).catch(() => {})
  }, [days])

  const steps = [
    { label: 'Chat Açılma', value: funnel?.opened ?? 0, rate: null },
    { label: 'Mesaj Yazan', value: funnel?.messaged ?? 0, rate: percent(funnel?.messaged, funnel?.opened) },
    { label: "WhatsApp'a Geçen", value: funnel?.whatsapp ?? 0, rate: percent(funnel?.whatsapp, funnel?.messaged) },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-gray-300" />
          <h3 className="font-semibold text-gray-700 text-sm">Dönüşüm Hunisi</h3>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {[7, 30].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d} Gün
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center flex-1 min-w-0">
            {i > 0 && <ChevronRight size={18} className="text-gray-300 shrink-0 mx-1" />}
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold font-['Rajdhani'] text-gray-900">{step.value}</p>
              <p className="text-xs text-gray-500">{step.label}</p>
              {step.rate !== null && <p className="text-[11px] text-gray-400 mt-0.5">dönüşüm {step.rate}</p>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-300 mt-4">
        Açılma sayacı özelliğin yayına alındığı tarihten itibaren toplanır.
      </p>
    </div>
  )
}

function LeadsTab({ leadData, onDeleteLead, deletingId }) {
  const stats = leadData?.stats ?? { total: 0, active: 0, whatsapp: 0 }
  const leads = leadData?.leads ?? []

  if (stats.total === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users size={36} className="mx-auto mb-3 text-gray-300" />
        <p>Henüz potansiyel talep yok.</p>
        <p className="text-xs mt-1">Ziyaretçi chatbot'ta 2+ mesaj yazınca burada görünür.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Toplam Talep" value={stats.total} icon={Users} />
        <StatCard label="WhatsApp'a Geçen" value={stats.whatsapp} icon={Send} />
        <StatCard label="Kaçan (Geçmeyen)" value={stats.active} icon={Clock} />
      </div>
      <div className="space-y-3">
        {leads.map(l => (
          <LeadRow key={l.id} lead={l} onDelete={onDeleteLead} deleting={deletingId === l.id} />
        ))}
      </div>
    </>
  )
}

function RatingsTab({ ratingData, onDeleteRating, deletingId }) {
  const stats = ratingData?.stats ?? { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  const ratings = ratingData?.ratings ?? []
  const maxCount = Math.max(1, ...Object.values(stats.counts))

  if (stats.total === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Bot size={36} className="mx-auto mb-3 text-gray-300" />
        <p>Henüz değerlendirme yok.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-4xl font-bold text-gray-900 font-['Rajdhani']">{stats.average.toFixed(1).replace('.', ',')}</p>
          <Stars value={Math.round(stats.average)} size={18} />
          <p className="text-xs text-gray-400 uppercase tracking-widest">ortalama puan</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-2">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
              <Star size={12} className="text-amber-400 shrink-0" fill="currentColor" />
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#448834] rounded-full"
                  style={{ width: `${(stats.counts[star] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8">{stats.counts[star]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {ratings.map(r => (
          <RatingRow key={r.id} rating={r} onDelete={onDeleteRating} deleting={deletingId === r.id} />
        ))}
      </div>
    </>
  )
}

export default function ChatDegerlendirme() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [leadData, setLeadData] = useState(null)
  const [ratingData, setRatingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('leads') // 'leads' | 'ratings'
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    Promise.all([fetchChatLeads(), fetchChatRatings()])
      .then(([leads, ratings]) => {
        setLeadData(leads)
        setRatingData(ratings)
      })
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout()
          navigate('/admin/login')
        }
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDeleteLead(id) {
    if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteChatLead(id)
      setLeadData(await fetchChatLeads())
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteRating(id) {
    if (!confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      await deleteChatRating(id)
      setRatingData(await fetchChatRatings())
    } catch (err) {
      alert('Silinemedi: ' + err.message)
    } finally {
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chatbot</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {leadData?.stats?.total ?? 0} talep · {ratingData?.stats?.total ?? 0} değerlendirme
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {[
            { id: 'leads', label: 'Potansiyel Talepler' },
            { id: 'ratings', label: 'Değerlendirmeler' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <FunnelSection />

      {tab === 'leads' ? (
        <LeadsTab leadData={leadData} onDeleteLead={handleDeleteLead} deletingId={deletingId} />
      ) : (
        <RatingsTab ratingData={ratingData} onDeleteRating={handleDeleteRating} deletingId={deletingId} />
      )}
    </main>
  )
}
