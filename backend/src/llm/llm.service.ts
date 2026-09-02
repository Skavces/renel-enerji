import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

// 2026-09-02: Groq, chatbot'un kullandığı iki modeli haber vermeden kaldırdı;
// önce OpenRouter'a geçildi, ardından bu sınıf/dosya adları da GENEL (sağlayıcıdan
// bağımsız) hale getirildi — "LlmService" hangi sağlayıcıyı kullandığımızdan
// bağımsız kalır, bir daha sağlayıcı değiştirirsek yalnızca bu dosyadaki
// URL/model/auth biçimi değişir, sınıf adı ve tüm çağıranlar aynı kalır.
//
// ŞU AN OpenRouter kullanılıyor (https://openrouter.ai), OpenAI-uyumlu
// chat/completions endpoint'i. minimax/minimax-m3:free hem birincil hem yedek
// model olarak seçildi (canlı karşılaştırmalı testte: doğru Türkçe, doğru
// WhatsApp yönlendirme cümlesi, injection direnci, temiz JSON çıktısı — rakip
// ücretsiz modellerin çoğu ya sık rate-limit'e takıldı ya da JSON istendiğinde
// ham İngilizce reasoning metni döktü). Farklı bir model istenirse OpenRouter'ın
// /api/v1/models listesinden ":free" sonekli adaylar canlı test edilip
// buradan değiştirilir.
export const LLM_MODEL = 'minimax/minimax-m3:free'
export const LLM_FALLBACK_MODEL = 'minimax/minimax-m3:free'
export const LLM_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 15000

// OpenAI-uyumlu chat completions cevabından kullanılan alanlar
export interface LlmResponse {
  choices?: { message?: { content?: string } }[]
}

// chat = müşteri chatbot'u, parse = Instagram gönderi analizi.
// Listeler ayrı tutulur ki chatbot'un rate limiti parse'tan etkilenmesin.
export type LlmPurpose = 'chat' | 'parse'

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name)
  private legacyWarned = false

  constructor(private config: ConfigService) {}

  // Amaç bazlı anahtar listesi: LLM_CHAT_KEYS / LLM_PARSE_KEYS (virgüllü,
  // sıra = deneme önceliği). Yeni değişken tanımlı değilse eski LLM_API_KEY*
  // üçlüsünden aynı öncelikle türetilir — VPS .env güncellenmeden deploy bozulmaz.
  getKeys(purpose: LlmPurpose): string[] {
    const listVar = purpose === 'chat' ? 'LLM_CHAT_KEYS' : 'LLM_PARSE_KEYS'
    const list = (this.config.get<string>(listVar) ?? '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
    if (list.length) return list

    const key = this.config.get<string>('LLM_API_KEY')
    const key2 = this.config.get<string>('LLM_API_KEY_2')
    const key3 = this.config.get<string>('LLM_API_KEY_3')
    // Eski davranış: chatbot KEY_3'ü (yoksa KEY'i) tercih eder, parse KEY'i kullanır
    const legacy = purpose === 'chat' ? [key3 || key, key2] : [key, key2]
    const keys = legacy.filter((k): k is string => !!k)
    if (keys.length && !this.legacyWarned) {
      this.legacyWarned = true
      this.logger.warn(
        'LLM_CHAT_KEYS/LLM_PARSE_KEYS tanımlı değil; eski LLM_API_KEY* değişkenlerinden türetildi',
      )
    }
    return keys
  }

  private async request(key: string, payload: object): Promise<Response | null> {
    try {
      return await fetchWithTimeout(LLM_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(payload),
      }, REQUEST_TIMEOUT_MS)
    } catch (err) {
      this.logger.warn(`LLM isteği başarısız: ${err instanceof Error ? err.message : err}`)
      return null
    }
  }

  async call(
    keys: string[],
    payload: { model: string } & Record<string, unknown>,
  ): Promise<{ res: Response | null; data: LlmResponse | null }> {
    // Sırasıyla: birincil anahtar → yedek anahtar (429/5xx için) → yedek model
    const attempts = [
      { key: keys[0], model: payload.model, delayMs: 0 },
      { key: keys[1] ?? keys[0], model: payload.model, delayMs: 500 },
      { key: keys[0], model: LLM_FALLBACK_MODEL, delayMs: 1000 },
    ]

    let res: Response | null = null
    for (const attempt of attempts) {
      if (attempt.delayMs) await sleep(attempt.delayMs)
      res = await this.request(attempt.key, { ...payload, model: attempt.model })
      if (res?.ok) return { res, data: await res.json() }
      this.logger.warn(
        `LLM ${attempt.model} yanıtı: ${res ? res.status : 'ağ hatası/zaman aşımı'}`,
      )
    }

    this.logger.error(`LLM tüm denemelerde başarısız (son durum: ${res?.status ?? 'ağ hatası'})`)
    return { res, data: null }
  }

  // Tek deneme, fallback zinciri YOK (call()'un aksine). Sağlık kontrolü tam
  // olarak hangi modelin çalıştığını görmek istiyor; call()'daki otomatik
  // model değişimi bunu maskeler (bkz. llm-health.service.ts).
  async ping(key: string, model: string): Promise<boolean> {
    const res = await this.request(key, { model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 })
    return !!res?.ok
  }
}
