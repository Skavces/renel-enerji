import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant'
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 15000

// OpenAI-uyumlu chat completions cevabından kullanılan alanlar
export interface GroqResponse {
  choices?: { message?: { content?: string } }[]
}

// chat = müşteri chatbot'u, parse = Instagram gönderi analizi.
// Listeler ayrı tutulur ki chatbot'un rate limiti parse'tan etkilenmesin.
export type GroqPurpose = 'chat' | 'parse'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name)
  private legacyWarned = false

  constructor(private config: ConfigService) {}

  // Amaç bazlı anahtar listesi: GROQ_CHAT_KEYS / GROQ_PARSE_KEYS (virgüllü,
  // sıra = deneme önceliği). Yeni değişken tanımlı değilse eski GROQ_API_KEY*
  // üçlüsünden aynı öncelikle türetilir — VPS .env güncellenmeden deploy bozulmaz.
  getKeys(purpose: GroqPurpose): string[] {
    const listVar = purpose === 'chat' ? 'GROQ_CHAT_KEYS' : 'GROQ_PARSE_KEYS'
    const list = (this.config.get<string>(listVar) ?? '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
    if (list.length) return list

    const key = this.config.get<string>('GROQ_API_KEY')
    const key2 = this.config.get<string>('GROQ_API_KEY_2')
    const key3 = this.config.get<string>('GROQ_API_KEY_3')
    // Eski davranış: chatbot KEY_3'ü (yoksa KEY'i) tercih eder, parse KEY'i kullanır
    const legacy = purpose === 'chat' ? [key3 || key, key2] : [key, key2]
    const keys = legacy.filter((k): k is string => !!k)
    if (keys.length && !this.legacyWarned) {
      this.legacyWarned = true
      this.logger.warn(
        'GROQ_CHAT_KEYS/GROQ_PARSE_KEYS tanımlı değil; eski GROQ_API_KEY* değişkenlerinden türetildi',
      )
    }
    return keys
  }

  private async request(key: string, payload: object): Promise<Response | null> {
    try {
      return await fetchWithTimeout(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(payload),
      }, REQUEST_TIMEOUT_MS)
    } catch (err) {
      this.logger.warn(`Groq isteği başarısız: ${err instanceof Error ? err.message : err}`)
      return null
    }
  }

  async call(
    keys: string[],
    payload: { model: string } & Record<string, unknown>,
  ): Promise<{ res: Response | null; data: GroqResponse | null }> {
    // Sırasıyla: birincil anahtar → yedek anahtar (429/5xx için) → yedek model
    const attempts = [
      { key: keys[0], model: payload.model, delayMs: 0 },
      { key: keys[1] ?? keys[0], model: payload.model, delayMs: 500 },
      { key: keys[0], model: GROQ_FALLBACK_MODEL, delayMs: 1000 },
    ]

    let res: Response | null = null
    for (const attempt of attempts) {
      if (attempt.delayMs) await sleep(attempt.delayMs)
      res = await this.request(attempt.key, { ...payload, model: attempt.model })
      if (res?.ok) return { res, data: await res.json() }
      this.logger.warn(
        `Groq ${attempt.model} yanıtı: ${res ? res.status : 'ağ hatası/zaman aşımı'}`,
      )
    }

    this.logger.error(`Groq tüm denemelerde başarısız (son durum: ${res?.status ?? 'ağ hatası'})`)
    return { res, data: null }
  }
}
