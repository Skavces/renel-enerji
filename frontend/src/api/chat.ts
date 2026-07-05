import { API } from './config'
import type { ChatMessage } from '../types'

// Backend retry'ları dahil en kötü durumu karşılayacak kadar uzun
const TIMEOUT_MS = 60000

async function post(path: string, messages: ChatMessage[]): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<{ reply: string }> {
  const res = await post('/api/chat', messages)
  if (!res.ok) throw new Error('Yanıt alınamadı')
  return res.json()
}

export async function generateWhatsappSummary(messages: ChatMessage[]): Promise<{ text: string }> {
  const res = await post('/api/chat/summary', messages)
  if (!res.ok) throw new Error('Özet oluşturulamadı')
  return res.json()
}
