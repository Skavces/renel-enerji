import { Injectable, Logger } from '@nestjs/common'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

// OpenAI-uyumlu chat completions cevabından kullanılan alanlar
export interface GroqResponse {
  choices?: { message?: { content?: string } }[]
}

export const GROQ_MODEL = 'llama-3.3-70b-versatile'
export const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant'
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 15000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name)

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
    primaryKey: string,
    fallbackKey: string | undefined,
    payload: { model: string } & Record<string, unknown>,
  ): Promise<{ res: Response | null; data: GroqResponse | null }> {
    // Sırasıyla: birincil anahtar → yedek anahtar (429/5xx için) → yedek model
    const attempts = [
      { key: primaryKey, model: payload.model, delayMs: 0 },
      { key: fallbackKey ?? primaryKey, model: payload.model, delayMs: 500 },
      { key: primaryKey, model: GROQ_FALLBACK_MODEL, delayMs: 1000 },
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
