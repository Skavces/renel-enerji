import { API } from './config.js'

export async function fetchFaqs() {
  const res = await fetch(`${API}/api/faq`)
  if (!res.ok) throw new Error('SSS yüklenemedi')
  return res.json()
}
