import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

const HOUR_MS = 60 * 60 * 1000
const MAX_PER_HOUR = 5
const NTFY_TEXT_LIMIT = 4096

// DİKKAT: Bu servis Nest Logger'ın error() kancasından çağrılıyor (NtfyLogger).
// Burada Logger.error KULLANILMAZ — sonsuz döngü oluşur. Kendi hataları console'a yazılır.
@Injectable()
export class NtfyService {
  private lastSentByKey = new Map<string, number>()
  private windowStart = 0
  private sentInWindow = 0
  private suppressedCount = 0

  constructor(private config: ConfigService) {}

  private get credentials(): { url: string; topic: string; token?: string } | null {
    const url = this.config.get<string>('NTFY_URL')
    const topic = this.config.get<string>('NTFY_TOPIC')
    if (!url || !topic) return null
    return { url, topic, token: this.config.get<string>('NTFY_TOKEN') }
  }

  async send(text: string, priority?: 'default' | 'high'): Promise<void> {
    const creds = this.credentials
    if (!creds) return
    try {
      const headers: Record<string, string> = { 'Content-Type': 'text/plain; charset=utf-8' }
      if (creds.token) headers.Authorization = `Bearer ${creds.token}`
      if (priority === 'high') headers['X-Priority'] = 'high'

      const res = await fetchWithTimeout(
        `${creds.url.replace(/\/$/, '')}/${encodeURIComponent(creds.topic)}`,
        { method: 'POST', headers, body: text.slice(0, NTFY_TEXT_LIMIT) },
        10000,
      )
      if (!res.ok) console.error(`ntfy gönderimi başarısız: HTTP ${res.status}`)
    } catch (err) {
      console.error('ntfy gönderim hatası:', err instanceof Error ? err.message : err)
    }
  }

  // Hata bildirimi, spam korumalı: aynı hata saatte 1 kez, toplam saatte en fazla MAX_PER_HOUR.
  // Sayaçlar in-memory tutulur; restart'ta sıfırlanması kabul edilebilir.
  async notifyError(text: string): Promise<void> {
    if (!this.credentials) return
    const now = Date.now()

    const key = text.slice(0, 80)
    const lastForKey = this.lastSentByKey.get(key)
    if (lastForKey !== undefined && now - lastForKey < HOUR_MS) return

    if (now - this.windowStart >= HOUR_MS) {
      this.windowStart = now
      this.sentInWindow = 0
    }
    if (this.sentInWindow >= MAX_PER_HOUR) {
      this.suppressedCount++
      return
    }

    this.pruneKeys(now)
    this.lastSentByKey.set(key, now)
    this.sentInWindow++

    let suffix = ''
    if (this.suppressedCount > 0) {
      suffix = `\n(+ ${this.suppressedCount} hata daha bastırıldı)`
      this.suppressedCount = 0
    }
    await this.send(text + suffix, 'high')
  }

  private pruneKeys(now: number): void {
    if (this.lastSentByKey.size < 100) return
    for (const [key, ts] of this.lastSentByKey) {
      if (now - ts >= HOUR_MS) this.lastSentByKey.delete(key)
    }
  }
}
