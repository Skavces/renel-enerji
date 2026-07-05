import { API } from './config'
import type { ChatMessage } from '../types'

// Backend retry'ları dahil en kötü durumu karşılayacak kadar uzun
const TIMEOUT_MS = 60000

async function post(path: string, messages: ChatMessage[], sessionId?: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionId ? { messages, sessionId } : { messages }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function sendChatMessage(messages: ChatMessage[], sessionId?: string): Promise<{ reply: string }> {
  const res = await post('/api/chat', messages, sessionId)
  if (!res.ok) throw new Error('Yanıt alınamadı')
  return res.json()
}

export async function generateWhatsappSummary(messages: ChatMessage[], sessionId?: string): Promise<{ text: string }> {
  const res = await post('/api/chat/summary', messages, sessionId)
  if (!res.ok) throw new Error('Özet oluşturulamadı')
  return res.json()
}

export async function submitChatRating(rating: number, messages: ChatMessage[], sessionId?: string): Promise<void> {
  const res = await fetch(`${API}/api/chat/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionId ? { rating, messages, sessionId } : { rating, messages }),
  })
  if (!res.ok) throw new Error('Değerlendirme gönderilemedi')
}
