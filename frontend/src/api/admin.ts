import { API } from './config'
import type { Project, ProjectMedia, Reference, BlogPost, Faq, SyncStatus, ChatRating, ChatRatingStats, ChatLead, ChatLeadStats, ChatFunnel, AppLog, LogStats } from '../types'

function authOptions(extra: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...extra,
  }
}

function rateError(): never {
  throw Object.assign(new Error('429'), { status: 429 })
}

export async function login(
  username: string,
  password: string,
  rememberMe = false,
): Promise<{ preAuthToken?: string; requiresTwoFactor?: boolean }> {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe }),
  })
  if (res.status === 429) rateError()
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Giriş başarısız')
  return data
}

export async function verify2FA(
  preAuthToken: string,
  code: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/2fa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preAuthToken, code }),
  })
  if (res.status === 429) rateError()
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Geçersiz kod')
  return data
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
  if (!res.ok) throw new Error('Çıkış başarısız')
}

export async function changeCredentials(payload: {
  currentPassword: string
  newUsername?: string
  newPassword?: string
  totpCode?: string
}): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/credentials`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Değişiklik başarısız')
  return data
}

export async function get2FAStatus(): Promise<{ enabled: boolean }> {
  const res = await fetch(`${API}/api/auth/2fa/status`, authOptions())
  if (!res.ok) throw new Error('Durum alınamadı')
  return res.json()
}

export async function generate2FASetup(): Promise<{ secret: string; qrCode: string }> {
  const res = await fetch(`${API}/api/auth/2fa/setup`, authOptions())
  if (!res.ok) throw new Error('QR kodu üretilemedi')
  return res.json()
}

export async function confirm2FASetup(
  secret: string,
  code: string,
  currentCode?: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/2fa/setup/confirm`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ secret, code, ...(currentCode ? { currentCode } : {}) }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Doğrulama başarısız')
  return data
}

export async function remove2FA(code: string, currentPassword: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${API}/api/auth/2fa/setup`, {
    ...authOptions({ method: 'DELETE' }),
    body: JSON.stringify({ code, currentPassword }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || '2FA kaldırılamadı')
  return data
}

// Projects
export async function fetchAllProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/api/projects/admin/all`, authOptions())
  if (!res.ok) throw new Error('Projeler yüklenemedi')
  return res.json()
}

export async function syncInstagram(): Promise<{ status: string }> {
  const res = await fetch(`${API}/api/projects/admin/instagram-sync`, authOptions({ method: 'POST' }))
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Senkronizasyon başarısız')
  return json
}

export async function parseInstagramPost(text: string): Promise<Partial<Project>> {
  const res = await fetch(`${API}/api/projects/admin/parse-instagram`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ text }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Parse başarısız')
  return json
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API}/api/projects`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Proje oluşturulamadı')
  return json
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API}/api/projects/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Proje güncellenemedi')
  return json
}

export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/projects/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API}/api/projects/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Proje silinemedi')
}

export async function uploadMedia(projectId: string, files: File[]): Promise<ProjectMedia[]> {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yükleme başarısız')
  return json
}

export async function linkMedia(projectId: string, src: string): Promise<ProjectMedia> {
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media/link`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ src }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Bağlantı oluşturulamadı')
  return json
}

export async function deleteMedia(projectId: string, mediaId: string): Promise<void> {
  const res = await fetch(`${API}/api/projects/${projectId}/media/${mediaId}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Medya silinemedi')
}

export async function reorderMedia(projectId: string, orderedIds: string[]): Promise<Project> {
  const res = await fetch(`${API}/api/projects/${projectId}/media/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama güncellenemedi')
  return res.json()
}

// References
export async function fetchAllReferences(): Promise<Reference[]> {
  const res = await fetch(`${API}/api/references/admin/all`, authOptions())
  if (!res.ok) throw new Error('Referanslar yüklenemedi')
  return res.json()
}

export async function createReference(data: Partial<Reference>): Promise<Reference> {
  const res = await fetch(`${API}/api/references`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Referans oluşturulamadı')
  return json
}

export async function updateReference(id: string, data: Partial<Reference>): Promise<Reference> {
  const res = await fetch(`${API}/api/references/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Referans güncellenemedi')
  return json
}

export async function reorderReferences(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/references/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function deleteReference(id: string): Promise<void> {
  const res = await fetch(`${API}/api/references/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Referans silinemedi')
}

export async function uploadReferenceLogo(referenceId: string, file: File): Promise<Reference> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/api/upload/references/${referenceId}/logo`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Logo yüklenemedi')
  return json
}

// Blog
export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${API}/api/blog/admin/all`, authOptions())
  if (!res.ok) throw new Error('Blog yazıları yüklenemedi')
  return res.json()
}

export async function createBlogPost(data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${API}/api/blog`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yazı oluşturulamadı')
  return json
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
  const res = await fetch(`${API}/api/blog/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yazı güncellenemedi')
  return json
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await fetch(`${API}/api/blog/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Yazı silinemedi')
}

export async function reorderBlogPosts(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/blog/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function uploadBlogCover(postId: string, file: File): Promise<BlogPost> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/api/upload/blog/${postId}/cover`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Kapak görseli yüklenemedi')
  return json
}

// SSS (FAQ)
export async function fetchAllFaqs(): Promise<Faq[]> {
  const res = await fetch(`${API}/api/faq/admin/all`, authOptions())
  if (!res.ok) throw new Error('SSS yüklenemedi')
  return res.json()
}

export async function createFaq(data: Partial<Faq>): Promise<Faq> {
  const res = await fetch(`${API}/api/faq`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'SSS oluşturulamadı')
  return json
}

export async function updateFaq(id: string, data: Partial<Faq>): Promise<Faq> {
  const res = await fetch(`${API}/api/faq/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'SSS güncellenemedi')
  return json
}

export async function deleteFaq(id: string): Promise<void> {
  const res = await fetch(`${API}/api/faq/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('SSS silinemedi')
}

// Chat değerlendirmeleri
export async function fetchChatRatings(
  page = 1,
): Promise<{ stats: ChatRatingStats; ratings: ChatRating[]; page: number; pageCount: number }> {
  const res = await fetch(`${API}/api/chat/rating/admin/all?page=${page}`, authOptions())
  if (!res.ok) throw new Error('Değerlendirmeler yüklenemedi')
  return res.json()
}

// Chat potansiyel talepleri (lead)
export async function fetchChatLeads(
  page = 1,
): Promise<{ stats: ChatLeadStats; leads: ChatLead[]; page: number; pageCount: number }> {
  const res = await fetch(`${API}/api/chat/lead/admin/all?page=${page}`, authOptions())
  if (!res.ok) throw new Error('Talepler yüklenemedi')
  return res.json()
}

// Chatbot dönüşüm hunisi (açılma → mesaj → WhatsApp)
export async function fetchChatFunnel(days: 7 | 30): Promise<ChatFunnel> {
  const res = await fetch(`${API}/api/chat/lead/admin/funnel?days=${days}`, authOptions())
  if (!res.ok) throw new Error('Huni istatistikleri yüklenemedi')
  return res.json()
}

export async function deleteChatLead(id: string): Promise<void> {
  const res = await fetch(`${API}/api/chat/lead/admin/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Talep silinemedi')
}

export async function deleteChatRating(id: string): Promise<void> {
  const res = await fetch(`${API}/api/chat/rating/admin/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Değerlendirme silinemedi')
}

export async function reorderFaqs(orderedIds: string[]): Promise<void> {
  const res = await fetch(`${API}/api/faq/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

// Backend hata/uyarı logları (admin panel → Loglar)
export async function fetchLogs(
  level?: 'error' | 'warn',
  page = 1,
): Promise<{ stats: LogStats; logs: AppLog[]; page: number; pageCount: number }> {
  const params = new URLSearchParams({ page: String(page) })
  if (level) params.set('level', level)
  const res = await fetch(`${API}/api/logs/admin/all?${params}`, authOptions())
  if (!res.ok) throw new Error('Loglar yüklenemedi')
  return res.json()
}
