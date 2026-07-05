import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronDown, MessageCircle, Bot } from 'lucide-react'
import { fetchChatRatings } from '../../api/admin'
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

function RatingRow({ rating }) {
  const [expanded, setExpanded] = useState(false)
  const hasConversation = rating.conversation?.length > 0
  const date = new Date(rating.createdAt).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => hasConversation && setExpanded(e => !e)}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left ${hasConversation ? '' : 'cursor-default'}`}
      >
        <Stars value={rating.rating} />
        <span className="text-sm text-gray-500 flex items-center gap-1.5">
          <MessageCircle size={14} className="text-gray-300" />
          {rating.messageCount} mesaj
        </span>
        <span className="flex-1 text-right text-xs text-gray-400">{date}</span>
        {hasConversation && (
          <ChevronDown
            size={16}
            className={`text-gray-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-4 pt-1 border-t border-gray-50 space-y-2">
          {rating.conversation.map((m, i) => (
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
      )}
    </div>
  )
}

export default function ChatDegerlendirme() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChatRatings()
      .then(setData)
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          logout()
          navigate('/admin/login')
        }
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      </main>
    )
  }

  const stats = data?.stats ?? { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  const ratings = data?.ratings ?? []
  const maxCount = Math.max(1, ...Object.values(stats.counts))

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Chatbot Değerlendirmeleri</h1>
        <p className="text-sm text-gray-400 mt-0.5">{stats.total} değerlendirme</p>
      </div>

      {stats.total === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bot size={36} className="mx-auto mb-3 text-gray-300" />
          <p>Henüz değerlendirme yok.</p>
        </div>
      ) : (
        <>
          {/* Özet */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
              <p className="text-4xl font-bold text-gray-900">{stats.average.toFixed(1).replace('.', ',')}</p>
              <Stars value={Math.round(stats.average)} size={18} />
              <p className="text-xs text-gray-400">ortalama puan</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-2">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                  <Star size={12} className="text-amber-400 shrink-0" fill="currentColor" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
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

          {/* Liste */}
          <div className="space-y-3">
            {ratings.map(r => <RatingRow key={r.id} rating={r} />)}
          </div>
        </>
      )}
    </main>
  )
}
