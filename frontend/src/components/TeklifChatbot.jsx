import { useEffect, useRef, useState } from 'react'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { sendChatMessage } from '../api/chat'

const GREETING = 'Merhaba! Ben RenEl Enerji\'nin yapay zeka asistanıyım. Size en uygun güneş enerjisi sistemini bulmak için birkaç soru sormak istiyorum. Hazır mısınız?'

export default function TeklifChatbot({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: GREETING },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMessage = { role: 'user', content: text }
    const updated = [...messages, userMessage]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const { reply } = await sendChatMessage(
        updated.filter(m => m.role !== 'assistant' || m.content !== GREETING ? true : false)
          .map(m => ({ role: m.role, content: m.content }))
      )
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen doğrudan iletişime geçin: 0554 379 60 04',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#448834] px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">RenEl Enerji Asistanı</p>
            <p className="text-white/70 text-xs">Size en uygun sistemi bulalım</p>
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 bg-[#448834] rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <Bot size={13} className="text-white" />
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

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Mesajınızı yazın..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#448834] transition-colors max-h-24 leading-relaxed"
              style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-[#448834] hover:bg-[#357228] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
              aria-label="Gönder"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Gerçek teklif için{' '}
            <a href="https://wa.me/905543796004" target="_blank" rel="noopener noreferrer" className="text-[#448834] hover:underline">
              WhatsApp
            </a>
            {' '}veya{' '}
            <a href="mailto:mertcan.yilmaz@renelenerji.com" className="text-[#448834] hover:underline">
              e-posta
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
