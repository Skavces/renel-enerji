import { API } from './config.js'

export async function sendChatMessage(messages) {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error('Yanıt alınamadı')
  return res.json()
}

export async function generateWhatsappSummary(messages) {
  const res = await fetch(`${API}/api/chat/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error('Özet oluşturulamadı')
  return res.json()
}
