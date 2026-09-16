import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

// 2026-09-02: Groq, chatbot'un kullandığı iki modeli haber vermeden kaldırdı;
// önce OpenRouter'a geçildi, ardından bu sınıf/dosya adları da GENEL (sağlayıcıdan
// bağımsız) hale getirildi — "LlmService" hangi sağlayıcıyı kullandığımızdan
// bağımsız kalır, bir daha sağlayıcı değiştirirsek yalnızca bu dosyadaki
// URL/model/auth biçimi değişir, sınıf adı ve tüm çağıranlar aynı kalır.
//
// 2026-09-16: minimax/minimax-m3:free OpenRouter'dan tamamen kaldırıldı
// (/api/v1/models listesinde artık yok, 5 gündür 404) — chatbot tamamen
// çalışmıyordu. Ayrıca LLM_MODEL === LLM_FALLBACK_MODEL olduğu için call()'daki
// "yedek modele düş" denemesi de aynı ölü modele gidiyordu, gerçek bir
// yedeklilik hiç yoktu. İlk deneme olarak seçilen z-ai/glm-5.2:free ve
// google/gemma-4-31b-it:free de canlıda sürekli 429 (rate limit) verdi —
// gerçek anahtarla /api/v1/chat/completions'a canlı istek atılarak 7 aday
// tarandı, yalnızca 4'ü 200 döndü. Bu yüzden FARKLI sağlayıcılardan, gerçekten
// yanıt veren iki model seçildi: birincil nvidia/nemotron-3-super-120b-a12b:free
// (büyük model, kapasite yeterli), yedek nex-agi/nex-n2.5-pro:free (liquid/
// lfm-2.5-2.6b:free de 200 döndü ama 2.6B çok küçük, Türkçe/JSON kalitesi
// riskli görüldüğü için tercih edilmedi). Canlıda LlmHealthService günlük
// sağlık kontrolüyle doğrulanır. Farklı bir model istenirse OpenRouter'ın
// /api/v1/models listesinden ":free" sonekli adaylar canlı test edilip
// buradan değiştirilir.
export const LLM_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
export const LLM_FALLBACK_MODEL = 'nex-agi/nex-n2.5-pro:free'
export const LLM_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 15000

// OpenAI-uyumlu chat completions cevabından kullanılan alanlar. `error`:
// OpenRouter, sağlayıcı (ör. Nvidia) aşırı yüklendiğinde HTTP 200 ile birlikte
// gövdede hata döndürebiliyor (bkz. call()) — yalnızca res.ok'a bakmak bunu kaçırır.
export interface LlmResponse {
  choices?: { message?: { content?: string } }[]
  error?: { message?: string; code?: number | string }
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
    let lastStatus: number | string = 'ağ hatası'
    for (const attempt of attempts) {
      if (attempt.delayMs) await sleep(attempt.delayMs)
      res = await this.request(attempt.key, { ...payload, model: attempt.model })
      if (res?.ok) {
        const data: LlmResponse = await res.json()
        if (!data.error) return { res, data }
        lastStatus = `200 (gövdede hata: ${data.error.message ?? data.error.code ?? '?'})`
        this.logger.warn(`LLM ${attempt.model} yanıtı: ${lastStatus}`)
        continue
      }
      lastStatus = res?.status ?? 'ağ hatası'
      this.logger.warn(
        `LLM ${attempt.model} yanıtı: ${res ? res.status : 'ağ hatası/zaman aşımı'}`,
      )
    }

    this.logger.error(`LLM tüm denemelerde başarısız (son durum: ${lastStatus})`)
    return { res, data: null }
  }

  // Tek deneme, fallback zinciri YOK (call()'un aksine). Sağlık kontrolü tam
  // olarak hangi modelin çalıştığını görmek istiyor; call()'daki otomatik
  // model değişimi bunu maskeler (bkz. llm-health.service.ts).
  async ping(key: string, model: string): Promise<boolean> {
    const res = await this.request(key, { model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5 })
    if (!res?.ok) return false
    const data: LlmResponse = await res.json()
    return !data.error
  }
}
