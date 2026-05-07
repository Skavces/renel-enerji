const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('admin_token')
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
}

export async function login(username, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
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

export async function get2FAStatus() {
  const res = await fetch(`${API}/api/auth/2fa/status`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Durum alınamadı')
  return res.json()
}

export async function generate2FASetup() {
  const res = await fetch(`${API}/api/auth/2fa/setup`, { headers: authHeaders() })
  if (!res.ok) throw new Error('QR kodu üretilemedi')
  return res.json()
}

export async function confirm2FASetup(secret, code) {
  const res = await fetch(`${API}/api/auth/2fa/setup/confirm`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ secret, code }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Doğrulama başarısız')
  return data
}

export async function remove2FA() {
  const res = await fetch(`${API}/api/auth/2fa/setup`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('2FA kaldırılamadı')
  return res.json()
}

export async function fetchAllProjects() {
  const res = await fetch(`${API}/api/projects/admin/all`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Projeler yüklenemedi')
  return res.json()
}

export async function createProject(data) {
  const res = await fetch(`${API}/api/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Proje oluşturulamadı')
  return json
}

export async function updateProject(id, data) {
  const res = await fetch(`${API}/api/projects/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Proje güncellenemedi')
  return json
}

export async function reorderProjects(orderedIds) {
  const res = await fetch(`${API}/api/projects/reorder`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function deleteProject(id) {
  const res = await fetch(`${API}/api/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Proje silinemedi')
}

export async function uploadMedia(projectId, files) {
  const form = new FormData()
  for (const file of files) form.append('files', file)
  const res = await fetch(`${API}/api/upload/projects/${projectId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Yükleme başarısız')
  return json
}

export async function deleteMedia(projectId, mediaId) {
  const res = await fetch(`${API}/api/projects/${projectId}/media/${mediaId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Medya silinemedi')
}

export async function reorderMedia(projectId, orderedIds) {
  const res = await fetch(`${API}/api/projects/${projectId}/media/reorder`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama güncellenemedi')
  return res.json()
}

// References
export async function fetchAllReferences() {
  const res = await fetch(`${API}/api/references/admin/all`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Referanslar yüklenemedi')
  return res.json()
}

export async function createReference(data) {
  const res = await fetch(`${API}/api/references`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Referans oluşturulamadı')
  return json
}

export async function updateReference(id, data) {
  const res = await fetch(`${API}/api/references/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Referans güncellenemedi')
  return json
}

export async function reorderReferences(orderedIds) {
  const res = await fetch(`${API}/api/references/reorder`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Sıralama kaydedilemedi')
}

export async function deleteReference(id) {
  const res = await fetch(`${API}/api/references/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Referans silinemedi')
}

export async function uploadReferenceLogo(referenceId, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API}/api/upload/references/${referenceId}/logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: form,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Logo yüklenemedi')
  return json
}
