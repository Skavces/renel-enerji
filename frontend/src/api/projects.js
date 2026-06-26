import { API } from './config.js'

export function mediaUrl(src) {
  if (!src) return ''
  if (src.startsWith('http')) return src
  if (src.startsWith('/uploads')) return `${API}${src}`
  return src
}

export async function fetchProjects() {
  const res = await fetch(`${API}/api/projects`)
  if (!res.ok) throw new Error('Projeler yüklenemedi')
  return res.json()
}

export async function fetchProjectBySlug(slug) {
  const res = await fetch(`${API}/api/projects/${slug}`)
  if (!res.ok) throw new Error('Proje bulunamadı')
  return res.json()
}
