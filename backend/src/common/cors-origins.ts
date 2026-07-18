// CORS origin listesi: CORS_ORIGINS doluysa virgüllü açık liste aynen kullanılır
// (www türetme yok); boşsa geriye uyumluluk için FRONTEND_URL'den www'lu varyant
// türetilir. Origin header'da trailing slash olmadığından sondaki '/' kırpılır.
export function resolveCorsOrigins(corsOrigins: string | undefined, frontendUrl: string): string[] {
  const explicit = (corsOrigins ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin !== '')
  if (explicit.length > 0) return [...new Set(explicit)]

  const originUrl = new URL(frontendUrl)
  const origins = [frontendUrl.replace(/\/+$/, '')]
  const isIp = /^[\d.]+$/.test(originUrl.hostname)
  if (!originUrl.hostname.startsWith('www.') && !isIp) {
    originUrl.hostname = `www.${originUrl.hostname}`
    origins.push(originUrl.toString().replace(/\/$/, ''))
  }
  return origins
}
