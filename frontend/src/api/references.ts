import { API } from './config'
import type { Reference } from '../types'

export async function fetchReferences(): Promise<Reference[]> {
  const res = await fetch(`${API}/api/references`)
  if (!res.ok) throw new Error('Referanslar yüklenemedi')
  return res.json()
}
