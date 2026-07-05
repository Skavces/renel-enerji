import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

const HOUR_MS = 60 * 60 * 1000
const MAX_PER_HOUR = 5
const TELEGRAM_TEXT_LIMIT = 4096

// DİKKAT: Bu servis Nest Logger'ın error() kancasından çağrılıyor (TelegramLogger).
// Burada Logger.error KULLANILMAZ — sonsuz döngü oluşur. Kendi hataları console'a yazılır.
@Injectable()
export class TelegramService {
  private lastSentByKey = new Map<string, number>()
  private windowStart = 0
  private sentInWindow = 0
  private suppressedCount = 0

  constructor(private config: ConfigService) {}

  private get credentials(): { token: string; chatId: string } | null {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN')
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID')
    if (!token || !chatId) return null
    return { token, chatId }
  }

  async send(text: string): Promise<void> {
    const creds = this.credentials
    if (!creds) return
    try {
      const res = await fetchWithTimeout(
        `https://api.telegram.org/bot${creds.token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: creds.chatId, text: text.slice(0, TELEGRAM_TEXT_LIMIT) }),
        },
        10000,
      )
      if (!res.ok) console.error(`Telegram sendMessage başarısız: HTTP ${res.status}`)
    } catch (err) {
      console.error('Telegram sendMessage hatası:', err instanceof Error ? err.message : err)
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
    await this.send(text + suffix)
  }

  private pruneKeys(now: number): void {
    if (this.lastSentByKey.size < 100) return
    for (const [key, ts] of this.lastSentByKey) {
      if (now - ts >= HOUR_MS) this.lastSentByKey.delete(key)
    }
  }
}
