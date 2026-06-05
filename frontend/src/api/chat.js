const API = import.meta.env.VITE_API_URL || ''

export async function sendChatMessage(messages) {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!res.ok) throw new Error('Yanıt alınamadı')
  return res.json()
}
