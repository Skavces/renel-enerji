import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, MessageCircle, Zap, Droplets, Car, Wifi, Battery } from 'lucide-react'
import { sendChatMessage, generateWhatsappSummary } from '../api/chat'

const GREETING = 'Merhaba, RenEl Enerji Mühendislik\'e hoş geldiniz. Size en uygun güneş enerjisi sistemini belirlemek için birkaç soru sormak istiyorum. Hangi konuda bilgi almak istersiniz?'

const QUICK_REPLIES = [
  { label: 'Çatı Tipi GES', desc: 'Konut veya ticari bina çatısına kurulum', icon: Zap, value: 'Çatı tipi güneş enerjisi sistemi hakkında bilgi almak istiyorum.' },
  { label: 'Tarımsal Sulama GES', desc: 'Tarla ve bahçe sulama sistemleri', icon: Droplets, value: 'Tarımsal sulama için güneş enerjisi sistemi hakkında bilgi almak istiyorum.' },
  { label: 'EV Şarj İstasyonu', desc: 'Elektrikli araç şarj altyapısı', icon: Car, value: 'Elektrikli araç şarj istasyonu hakkında bilgi almak istiyorum.' },
  { label: 'Off-Grid Sistem', desc: 'Şebekeden tamamen bağımsız çözüm', icon: Wifi, value: 'Şebekeden bağımsız off-grid sistem hakkında bilgi almak istiyorum.' },
  { label: 'Hibrit GES', desc: 'Bataryalı + şebekeli kombinasyon', icon: Battery, value: 'Bataryalı hibrit güneş enerjisi sistemi hakkında bilgi almak istiyorum.' },
]

const WHATSAPP_NUMBER = '905543796004'

export default function TeklifChatbot({ onClose, closing, messages: initialMessages, onMessagesChange }) {
  const [messages, setMessages] = useState(
    initialMessages ?? [{ role: 'assistant', content: GREETING }]
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)

  function saveMessages(next) {
    setMessages(next)
    onMessagesChange?.(next)
  }

  const userMessageCount = messages.filter(m => m.role === 'user').length
  const showWhatsapp = userMessageCount >= 2

  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (messagesRef.current) messagesRef.current.scrollTop = 0
    inputRef.current?.focus()
  }, [])

  async function send(text) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMessage = { role: 'user', content: trimmed }
    const updated = [...messages, userMessage]
    saveMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const history = updated.filter(
        m => !(m.role === 'assistant' && m.content === GREETING)
      )
      const { reply } = await sendChatMessage(history)
      const withReply = [...updated, { role: 'assistant', content: reply }]
      saveMessages(withReply)
    } catch {
      const withError = [...updated, {
        role: 'assistant',
        content: 'Üzgünüz, şu anda yanıt veremiyoruz. Lütfen doğrudan iletişime geçin: 0554 379 60 04',
      }]
      saveMessages(withError)
    } finally {
      setLoading(false)
    }
  }

  async function handleWhatsapp() {
    setSummaryLoading(true)
    try {
      const history = messages.filter(
        m => !(m.role === 'assistant' && m.content === GREETING)
      )
      const { text } = await generateWhatsappSummary(history)
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener,noreferrer')
    } finally {
      setSummaryLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:inset-auto sm:bottom-20 sm:right-6">
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm sm:hidden ${closing ? 'backdrop-exit' : 'backdrop-enter'}`} onClick={onClose} />

      <div className={`relative w-full sm:w-[400px] h-[85vh] sm:h-[560px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden origin-bottom sm:origin-bottom-right ${closing ? 'chatbot-exit' : 'chatbot-enter'}`}>
        {/* Header */}
        <div className="bg-[#448834] px-5 py-4 flex items-center gap-3 shrink-0">
          <img src="/renel-logo.svg" alt="RenEl" className="w-10 h-10" style={{ filter: 'brightness(0) invert(1)' }} />
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">RenEl Enerji Danışmanı</p>
            <p className="text-white/70 text-xs">Size en uygun sistemi belirleyelim</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url(/aichatwallpaper.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5 shadow-sm border border-gray-100">
                  <img src="/renel-logo.svg" alt="RenEl" className="w-6 h-6" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#448834] text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {/* Hızlı seçim kartları */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-col gap-2">
              {QUICK_REPLIES.map(qr => {
                const Icon = qr.icon
                return (
                  <button
                    key={qr.label}
                    onClick={() => send(qr.value)}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 bg-white border border-gray-200 hover:border-[#448834] hover:bg-[#f5fbf3] rounded-xl transition-colors shadow-sm group"
                  >
                    <Icon size={16} className="text-[#448834] shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{qr.label}</p>
                      <p className="text-xs text-gray-400">{qr.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 bg-[#448834] rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader2 size={16} className="text-[#448834] animate-spin" />
              </div>
            </div>
          )}

        </div>

        {/* WhatsApp butonu */}
        {showWhatsapp && (
          <div className="px-4 pt-3 bg-white border-t border-gray-100 shrink-0">
            <button
              onClick={handleWhatsapp}
              disabled={summaryLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              {summaryLoading ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
              {summaryLoading ? 'Hazırlanıyor...' : 'WhatsApp\'tan Teklif Al'}
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Mesajınızı yazın..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#448834] transition-colors max-h-24 leading-relaxed"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-[#448834] hover:bg-[#357228] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              aria-label="Gönder"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
