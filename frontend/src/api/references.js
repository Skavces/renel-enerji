import { API } from './config.js'

export async function fetchReferences() {
  const res = await fetch(`${API}/api/references`)
  if (!res.ok) throw new Error('Referanslar yüklenemedi')
  return res.json()
}
