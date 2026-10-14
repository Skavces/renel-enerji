import { mediaUrl } from '../api/projects'
import type { Project } from '../types'

export interface ProjectCover {
  // Statik kapak görseli; kapak video ise videonun posteri
  image: string | null
  // Admin kapak olarak bir video seçtiyse videonun adresi
  video: string | null
}

// Kapak seçimi backend'deki ProjectsService.coverOnly ile birebir:
// admin seçimi (coverMediaId) > thumbnail > en düşük sortOrder'lı görsel.
// Video seçildiyse poster = thumbnail, yoksa ilk görsel.
export function projectCover(p: Pick<Project, 'media' | 'coverMediaId'>): ProjectCover {
  const media = p.media || []
  const thumb = media.find((m) => m.type === 'thumbnail')
  const firstImage = [...media]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((m) => m.type === 'image')
  const poster = thumb ?? firstImage

  const chosen = p.coverMediaId ? media.find((m) => m.id === p.coverMediaId) : undefined
  if (chosen?.type === 'image') return { image: mediaUrl(chosen.src) || null, video: null }
  if (chosen?.type === 'video') {
    return { image: poster ? mediaUrl(poster.src) || null : null, video: mediaUrl(chosen.src) || null }
  }

  return { image: poster ? mediaUrl(poster.src) || null : null, video: null }
}

export function coverPhoto(p: Pick<Project, 'media' | 'coverMediaId'>): string | null {
  return projectCover(p).image
}
