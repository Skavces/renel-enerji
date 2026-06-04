import { useState, useEffect } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    let t
    if (open) {
      requestAnimationFrame(() => {
        setVisible(true)
        requestAnimationFrame(() => setAnimating(true))
      })
    } else {
      t = setTimeout(() => {
        setAnimating(false)
        setTimeout(() => setVisible(false), 600)
      }, 0)
    }
    return () => clearTimeout(t)
  }, [open])

  const handleSend = () => {
    const text = message.trim() || 'Merhaba, güneş enerjisi hakkında bilgi almak istiyorum.'
    window.open(`https://wa.me/905543796004?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {visible && (
        <div
          className="rounded-2xl shadow-2xl w-80 overflow-hidden"
          style={{
            fontFamily: 'system-ui, sans-serif',
            transformOrigin: 'bottom right',
            transition: 'opacity 600ms ease, transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: animating ? 1 : 0,
            transform: animating ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          }}
        >

          {/* Header — WhatsApp koyu yeşil */}
          <div className="px-4 py-3 flex items-center justify-between" style={{background: '#1a7a3a'}}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden p-1">
                <img src="/renel-logo.svg" alt="RenEl Logo" className="w-full h-full object-contain" loading="lazy" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Mertcan Yılmaz</p>
                <p className="text-white/70 text-xs">RenEl Enerji · çevrimiçi</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Chat area — WhatsApp chat arka planı */}
          <div className="p-4 min-h-[120px]" style={{background: '#e5ddd5'}}>
            {/* Gelen mesaj balonu */}
            <div className="flex items-end gap-1 max-w-[85%]">
              <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 shadow-sm text-sm text-gray-800 leading-relaxed">
                Merhaba! 👋 Size Nasıl Yardımcı Olabiliriz?
                <span className="block text-right text-[10px] text-gray-400 mt-1">
                  {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })}
                </span>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2 px-3 py-2.5" style={{background: '#f0f0f0'}}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Mesaj yazın..."
              rows={1}
              className="flex-1 resize-none rounded-full px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none leading-snug"
              style={{background: '#fff', maxHeight: '80px', overflowY: 'auto'}}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{background: '#1a7a3a'}}
            >
              <Send size={17} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 text-white shadow-lg shadow-black/15 px-5 py-3 rounded-full transition-all hover:scale-105"
        style={{background: '#1a7a3a'}}
        aria-label="WhatsApp"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        <span className="font-semibold text-sm whitespace-nowrap">
          {open ? 'Kapat' : 'Size nasıl yardımcı olabiliriz?'}
        </span>
      </button>
    </div>
  )
}
