import { fetchWithTimeout } from './fetch-with-timeout'

// Instagram Graph API yanıtından gelen media_url/thumbnail_url'ler doğrudan
// fetch'e verilmesin diye SSRF allow-list'i — yalnızca Meta CDN host'ları.
const ALLOWED_MEDIA_HOSTS = [/(^|\.)fbcdn\.net$/, /(^|\.)cdninstagram\.com$/]
const MAX_REDIRECTS = 3

export function assertAllowedMediaHost(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Geçersiz medya URL'i: ${url}`)
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_MEDIA_HOSTS.some(h => h.test(parsed.hostname))) {
    throw new Error(`İzin verilmeyen medya kaynağı: ${parsed.hostname}`)
  }
}

// fetch varsayılan olarak yönlendirmeleri sessizce takip eder — yalnızca ilk
// URL'i doğrulamak allow-list'i bir 302 ile atlatılabilir kılardı. Bu yüzden
// redirect:'manual' ile her hop elle takip edilip tekrar doğrulanıyor.
export async function fetchAllowedMedia(url: string, timeoutMs?: number): Promise<Response> {
  let current = url
  for (let hop = 0; ; hop++) {
    assertAllowedMediaHost(current)
    const res = await fetchWithTimeout(current, { redirect: 'manual' }, timeoutMs)
    if (res.status < 300 || res.status >= 400 || !res.headers.has('location')) {
      return res
    }
    await res.body?.cancel()
    if (hop >= MAX_REDIRECTS) {
      throw new Error(`Medya indirmede çok fazla yönlendirme: ${url}`)
    }
    current = new URL(res.headers.get('location') as string, current).toString()
  }
}
