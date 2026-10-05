import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

// 2026-09-02: Groq, chatbot'un kullandığı iki modeli haber vermeden kaldırdı;
// önce OpenRouter'a geçildi, ardından bu sınıf/dosya adları da GENEL (sağlayıcıdan
// bağımsız) hale getirildi — "LlmService" hangi sağlayıcıyı kullandığımızdan
// bağımsız kalır, bir daha sağlayıcı değiştirirsek yalnızca bu dosyadaki
// URL/model/auth biçimi değişir, sınıf adı ve tüm çağıranlar aynı kalır.
//
// 2026-10-05: OpenRouter'ın ücretsiz modelleri güvenilmez çıktı: yedek model
// (nex-agi/nex-n2.5-pro:free) listeden kalktı, birincil model (nemotron-3-super)
// HTTP 200 ile boş içerik döndürmeye başladı ve chatbot tamamen çalışmaz oldu
// (call() boş içeriği başarı sayıp yedeğe hiç düşmüyordu). Groq'a geri dönüldü
// (OpenAI uyumlu, tek fark URL/model). 2026-09-02'de Groq'un kaldırdığı Llama
// modelleri artık canlı listede de yok (Enterprise-only); canlı listede ve gerçek
// anahtarla chat biçiminde doğrulanan modeller seçildi: birincil openai/gpt-oss-120b
// (production katmanı), yedek ve dil denetçisi openai/gpt-oss-20b (ayrı rate limit
// havuzu, ~0.4 sn). İkisi de reasoning modeli: reasoning_effort "low" verilmezse
// token bütçesini düşünmeye harcayıp content'i boş bırakabilir (bkz. MODEL_PARAMS).
// Farklı bir model istenirse GET https://api.groq.com/openai/v1/models listesinden
// aday canlı denenip buradan değiştirilir.
export const LLM_MODEL = 'openai/gpt-oss-120b'
export const LLM_FALLBACK_MODEL = 'openai/gpt-oss-20b'
export const LLM_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const REQUEST_TIMEOUT_MS = 15000

// Anahtar soğuma süreleri: 401/403 = anahtar ölü/iptal (uzun), 429 = rate limit
// (Retry-After yoksa kısa). Soğuyan anahtar sıranın sonuna itilir, tamamen
// dışlanmaz: hepsi soğuyorsa yine de denenir.
const DEAD_KEY_COOLDOWN_MS = 60 * 60 * 1000
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000
const MAX_RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000

// Modele özgü ek istek parametreleri. gpt-oss reasoning modelidir; "low" olmadan
// max_tokens'ı (chatbot'ta 180, judge'da küçük) düşünmeye harcayıp boş içerik döner.
const MODEL_PARAMS: Record<string, Record<string, unknown>> = {
  'openai/gpt-oss-120b': { reasoning_effort: 'low' },
  'openai/gpt-oss-20b': { reasoning_effort: 'low' },
}

// OpenAI-uyumlu chat completions cevabından kullanılan alanlar. `error`:
// Sağlayıcı (ör. OpenRouter'da Nvidia) aşırı yüklendiğinde HTTP 200 ile birlikte
// gövdede hata döndürebiliyor (bkz. call()) — yalnızca res.ok'a bakmak bunu kaçırır.
export interface LlmResponse {
  choices?: {
    message?: { content?: string | null; reasoning?: string | null }
    finish_reason?: string | null
  }[]
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
  // Anahtar → soğuma bitiş zamanı (ms). Süreç içi; yeniden başlatmada sıfırlanır.
  private readonly cooldowns = new Map<string, number>()
  // Dönüşümlü başlangıç anahtarı: yükü (ve hesap başı günlük token limitini) dağıtır.
  private cursor = 0

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
        body: JSON.stringify({ ...payload, ...MODEL_PARAMS[(payload as { model?: string }).model ?? ''] }),
      }, REQUEST_TIMEOUT_MS)
    } catch (err) {
      this.logger.warn(`LLM isteği başarısız: ${err instanceof Error ? err.message : err}`)
      return null
    }
  }

  private static hasContent(data: LlmResponse): boolean {
    const content = data.choices?.[0]?.message?.content
    return typeof content === 'string' && content.trim().length > 0
  }

  // Boş yanıtın nedenini log'a taşır: finish_reason "length" + dolu reasoning,
  // modelin token bütçesini düşünmeye harcadığını gösterir.
  private static describeEmpty(data: LlmResponse): string {
    const choice = data.choices?.[0]
    if (!choice) return 'choices yok'
    const reasoningLen = choice.message?.reasoning?.length ?? 0
    return `finish_reason=${choice.finish_reason ?? '?'}, reasoning=${reasoningLen} karakter`
  }

  // Dönüşümlü başlangıçla anahtar sırası; soğuyanlar (401/403/429 almış) sona.
  private orderKeys(keys: string[]): string[] {
    const start = this.cursor++ % keys.length
    const rotated = [...keys.slice(start), ...keys.slice(0, start)]
    const now = Date.now()
    const active = rotated.filter(k => (this.cooldowns.get(k) ?? 0) <= now)
    const cooling = rotated.filter(k => (this.cooldowns.get(k) ?? 0) > now)
    return [...active, ...cooling]
  }

  private coolDownIfNeeded(key: string, res: Response): void {
    let ms = 0
    if (res.status === 401 || res.status === 403) {
      ms = DEAD_KEY_COOLDOWN_MS
    } else if (res.status === 429) {
      const retryAfterSec = Number(res.headers?.get?.('retry-after'))
      ms = Number.isFinite(retryAfterSec) && retryAfterSec > 0
        ? Math.min(retryAfterSec * 1000, MAX_RATE_LIMIT_COOLDOWN_MS)
        : RATE_LIMIT_COOLDOWN_MS
    }
    if (!ms) return
    this.cooldowns.set(key, Date.now() + ms)
    // Anahtarın kendisi loglanmaz; yalnızca "gsk_" sonrası ilk 4 karakter (hangisi olduğunu
    // ayırt etmek için; "gsk_" öneki tüm Groq anahtarlarında aynı)
    this.logger.warn(`LLM anahtarı (…${key.slice(4, 8)}…) ${Math.round(ms / 1000)} sn devre dışı: ${res.status}`)
  }

  async call(
    keys: string[],
    payload: { model: string } & Record<string, unknown>,
  ): Promise<{ res: Response | null; data: LlmResponse | null }> {
    // Sırasıyla: her anahtar birincil modelle (dönüşümlü başlangıç, soğuyanlar sonda)
    // → yedek model ilk sağlıklı anahtarla. Tek anahtar varsa aynı anahtar bir kez
    // daha denenir (eski davranış).
    const ordered = this.orderKeys(keys)
    const tries = ordered.length > 1 ? ordered : [ordered[0], ordered[0]]
    const attempts = [
      ...tries.map((key, i) => ({ key, model: payload.model, delayMs: i === 0 ? 0 : 500 })),
      { key: ordered[0], model: LLM_FALLBACK_MODEL, delayMs: 1000 },
    ]

    let res: Response | null = null
    let lastStatus: number | string = 'ağ hatası'
    for (const attempt of attempts) {
      if (attempt.delayMs) await sleep(attempt.delayMs)
      res = await this.request(attempt.key, { ...payload, model: attempt.model })
      if (res?.ok) {
        const data: LlmResponse = await res.json()
        if (!data.error) {
          // 200 + boş içerik de başarısızdır: reasoning modelleri token bütçesini
          // düşünmeye harcayıp content'i boş bırakabiliyor. Bunu başarı sayarsak
          // çağıran 503 verir ve yedek anahtar/model hiç denenmez.
          if (LlmService.hasContent(data)) return { res, data }
          lastStatus = `200 (boş içerik: ${LlmService.describeEmpty(data)})`
        } else {
          lastStatus = `200 (gövdede hata: ${data.error.message ?? data.error.code ?? '?'})`
        }
        this.logger.warn(`LLM ${attempt.model} yanıtı: ${lastStatus}`)
        continue
      }
      lastStatus = res?.status ?? 'ağ hatası'
      this.logger.warn(
        `LLM ${attempt.model} yanıtı: ${res ? res.status : 'ağ hatası/zaman aşımı'}`,
      )
      if (res) this.coolDownIfNeeded(attempt.key, res)
    }

    this.logger.error(`LLM tüm denemelerde başarısız (son durum: ${lastStatus})`)
    return { res, data: null }
  }

  // Tek deneme, fallback zinciri YOK (call()'un aksine). Sağlık kontrolü tam
  // olarak hangi modelin çalıştığını görmek istiyor; call()'daki otomatik
  // model değişimi bunu maskeler (bkz. llm-health.service.ts).
  // Gerçek chat çağrısıyla aynı biçimde (max_tokens dahil) ve YALNIZCA dolu bir
  // içerik döndüyse başarılı sayılır: eski "200 + hata yok" ölçütü, boş içerikle
  // dönen reasoning modelini sağlıklı gösteriyordu.
  async ping(key: string, model: string): Promise<boolean> {
    const res = await this.request(key, {
      model,
      messages: [{ role: 'user', content: 'Merhaba, tek cümleyle cevap ver.' }],
      max_tokens: 180,
    })
    if (!res?.ok) return false
    const data: LlmResponse = await res.json()
    return !data.error && LlmService.hasContent(data)
  }
}
