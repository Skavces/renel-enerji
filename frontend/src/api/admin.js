const API = import.meta.env.VITE_API_URL || ''

// Token artık httpOnly cookie'de gönderiliyor.
// Tüm korumalı isteklerde credentials: 'include' ekliyoruz.

function authOptions(extra = {}) {
  return {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...extra,
  }
}

export async function login(username, password, rememberMe = false) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, rememberMe }),
  })
  if (res.status === 429) {
    const err = new Error('429')
    err.status = 429
    throw err
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Giriş başarısız')
  return data
}

export async function verify2FA(preAuthToken, code) {
  const res = await fetch(`${API}/api/auth/2fa/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preAuthToken, code }),
  })
  if (res.status === 429) {
    const err = new Error('429')
    err.status = 429
    throw err
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Geçersiz kod')
  return data
}

export async function logout() {
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function changeCredentials({ currentPassword, newUsername, newPassword, totpCode }) {
  const res = await fetch(`${API}/api/auth/credentials`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ currentPassword, newUsername, newPassword, totpCode }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Değişiklik başarısız')
  return data
}

export async function get2FAStatus() {
  const res = await fetch(`${API}/api/auth/2fa/status`, authOptions())
  if (!res.ok) throw new Error('Durum alınamadı')
  return res.json()
}

export async function generate2FASetup() {
  const res = await fetch(`${API}/api/auth/2fa/setup`, authOptions())
  if (!res.ok) throw new Error('QR kodu üretilemedi')
  return res.json()
}

export async function confirm2FASetup(secret, code) {
  const res = await fetch(`${API}/api/auth/2fa/setup/confirm`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ secret, code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Doğrulama başarısız')
  return data
}

export async function remove2FA() {
  const res = await fetch(`${API}/api/auth/2fa/setup`, {
    ...authOptions({ method: 'DELETE' }),
  })
  if (!res.ok) throw new Error('2FA kaldırılamadı')
  return res.json()
}

export async function fetchAllProjects() {
  const res = await fetch(`${API}/api/projects/admin/all`, authOptions())
  if (!res.ok) throw new Error('Projeler yüklenemedi')
  return res.json()
}

export async function parseInstagramPost(text) {
  const res = await fetch(`${API}/api/projects/admin/parse-instagram`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ text }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Parse başarısız')
  return json
}

export async function createProject(data) {
  const res = await fetch(`${API}/api/projects`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Proje oluşturulamadı')
  return json
}

export async function updateProject(id, data) {
  const res = await fetch(`${API}/api/projects/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Proje güncellenemedi')
  return json
}

export async function reorderProjects(orderedIds) {
  const res = await fetch(`${API}/api/projects/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function deleteProject(id) {
  const res = await fetch(`${API}/api/projects/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Proje silinemedi')
}

export async function uploadMedia(projectId, files) {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  // FormData ile Content-Type header'ı otomatik set edilmeli — özel header verme
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yükleme başarısız')
  return json
}

export async function linkMedia(projectId, src) {
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media/link`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify({ src }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Bağlantı oluşturulamadı')
  return json
}

export async function deleteMedia(projectId, mediaId) {
  const res = await fetch(`${API}/api/projects/${projectId}/media/${mediaId}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Medya silinemedi')
}

export async function reorderMedia(projectId, orderedIds) {
  const res = await fetch(`${API}/api/projects/${projectId}/media/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama güncellenemedi')
  return res.json()
}

// References
export async function fetchAllReferences() {
  const res = await fetch(`${API}/api/references/admin/all`, authOptions())
  if (!res.ok) throw new Error('Referanslar yüklenemedi')
  return res.json()
}

export async function createReference(data) {
  const res = await fetch(`${API}/api/references`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Referans oluşturulamadı')
  return json
}

export async function updateReference(id, data) {
  const res = await fetch(`${API}/api/references/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Referans güncellenemedi')
  return json
}

export async function reorderReferences(orderedIds) {
  const res = await fetch(`${API}/api/references/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function deleteReference(id) {
  const res = await fetch(`${API}/api/references/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Referans silinemedi')
}

export async function uploadReferenceLogo(referenceId, file) {
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
export async function fetchAllBlogPosts() {
  const res = await fetch(`${API}/api/blog/admin/all`, authOptions())
  if (!res.ok) throw new Error('Blog yazıları yüklenemedi')
  return res.json()
}

export async function createBlogPost(data) {
  const res = await fetch(`${API}/api/blog`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yazı oluşturulamadı')
  return json
}

export async function updateBlogPost(id, data) {
  const res = await fetch(`${API}/api/blog/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yazı güncellenemedi')
  return json
}

export async function deleteBlogPost(id) {
  const res = await fetch(`${API}/api/blog/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('Yazı silinemedi')
}

export async function reorderBlogPosts(orderedIds) {
  const res = await fetch(`${API}/api/blog/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function uploadBlogCover(postId, file) {
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
export async function fetchAllFaqs() {
  const res = await fetch(`${API}/api/faq/admin/all`, authOptions())
  if (!res.ok) throw new Error('SSS yüklenemedi')
  return res.json()
}

export async function createFaq(data) {
  const res = await fetch(`${API}/api/faq`, {
    ...authOptions({ method: 'POST' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'SSS oluşturulamadı')
  return json
}

export async function updateFaq(id, data) {
  const res = await fetch(`${API}/api/faq/${id}`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'SSS güncellenemedi')
  return json
}

export async function deleteFaq(id) {
  const res = await fetch(`${API}/api/faq/${id}`, authOptions({ method: 'DELETE' }))
  if (!res.ok) throw new Error('SSS silinemedi')
}

export async function reorderFaqs(orderedIds) {
  const res = await fetch(`${API}/api/faq/reorder`, {
    ...authOptions({ method: 'PATCH' }),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}
