import { mediaUrl } from '../api/projects'
import type { Project } from '../types'

// Kapak seçimi backend'deki coverOnly ile birebir: thumbnail > en düşük sortOrder'lı görsel
export function coverPhoto(p: Pick<Project, 'media'>): string | null {
  const thumb = p.media?.find((m) => m.type === 'thumbnail')
  if (thumb) return mediaUrl(thumb.src)
  const sorted = [...(p.media || [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const first = sorted.find((m) => m.type === 'image')
  return first ? mediaUrl(first.src) : null
}
