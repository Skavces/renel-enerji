import { API } from './config'
import type { ChatMessage } from '../types'

export async function sendChatMessage(messages: ChatMessage[]): Promise<{ content: string }> {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error('Yanıt alınamadı')
  return res.json()
}

export async function generateWhatsappSummary(messages: ChatMessage[]): Promise<{ summary: string }> {
  const res = await fetch(`${API}/api/chat/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error('Özet oluşturulamadı')
  return res.json()
}
