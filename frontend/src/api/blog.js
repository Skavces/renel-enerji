import { API } from './config.js'

export async function fetchPosts() {
  const res = await fetch(`${API}/api/blog`)
  if (!res.ok) throw new Error('Blog yazıları yüklenemedi')
  return res.json()
}

export async function fetchPostBySlug(slug) {
  const res = await fetch(`${API}/api/blog/${slug}`)
  if (!res.ok) throw new Error('Blog yazısı bulunamadı')
  return res.json()
}
