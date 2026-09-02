import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import Redis from 'ioredis'
import { LlmService, LLM_MODEL, LLM_FALLBACK_MODEL } from '../llm/llm.service'
import { REDIS_CLIENT } from '../redis/redis.module'
import { extractTlAmounts, hasNonLatinLeak, hasPriceLeak, isContaminated, sanitizeContent } from './chat-guards'
import {
  JUDGE_SYSTEM_PROMPT,
  judgeUserMessage,
  PRICING_EXTRACTION_PROMPT,
  RETRY_NUDGE,
  SUMMARY_PROMPT,
  SYSTEM_PROMPT,
} from './chat-prompts'
import { PricingExtractionDto } from './pricing/pricing-extraction.dto'
import { EvSarjTipi, formatQuoteMessage, PricingCategory, PricingInput, resolveQuote } from './pricing/ges-pricing'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Günlük LLM bütçesi: kötüye kullanım kotayı bitirip gerçek müşterinin
// chatbot'unu susturmasın diye chatbot yoluna devre kesici konur.
// Instagram parse tarafı bu bütçeden BAĞIMSIZDIR (LlmService'i ayrıca kullanır).
const DEFAULT_DAILY_LIMIT = 1000
const BUDGET_KEY_PREFIX = 'llm:daily:'
const BUDGET_KEY_TTL_SECONDS = 48 * 60 * 60

export const BUDGET_EXCEEDED_MESSAGE =
  'Şu anda yoğunluk nedeniyle yanıt veremiyorum. Aşağıdaki "WhatsApp\'tan Teklif Al" ' +
  'butonuna basarak talebinizi doğrudan bize iletebilirsiniz.'

export class LlmBudgetExceededError extends Error {
  constructor() {
    super('LLM günlük bütçesi aşıldı')
  }
}

// Ucuz ön-kapı: yalnızca fiyat sorulan konuşmalarda çıkarım çağrısı yapılır
// (bütçe ve gecikme koruması — isContaminated önce, judge sonra felsefesinin
// aynısı). Tek turla değil, son 12 mesajlık pencereyle kontrol edilir — bkz. chat().
const PRICE_INTENT_PATTERN = /fiyat|ücret|maliyet|kaça|ne kadar|tutar|bütçe/i

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private config: ConfigService,
    private llm: LlmService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // true → istek bütçeye sığdı; false → günlük limit doldu.
  // Redis erişilemezse fail-open: chatbot bütçe yüzünden hiç susmasın.
  private async consumeDailyBudget(): Promise<boolean> {
    const limit = Number(this.config.get<string>('LLM_DAILY_LIMIT') ?? DEFAULT_DAILY_LIMIT)
    if (!Number.isFinite(limit) || limit <= 0) return true

    try {
      const key = `${BUDGET_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`
      const count = await this.redis.incr(key)
      if (count === 1) await this.redis.expire(key, BUDGET_KEY_TTL_SECONDS)
      if (count > limit) {
        // Log seline dönmesin: yalnızca eşiğin aşıldığı ilk istekte error bas
        if (count === limit + 1) this.logger.error(`LLM günlük bütçesi aşıldı (limit: ${limit})`)
        return false
      }
      return true
    } catch (err) {
      this.logger.warn(
        `Bütçe sayacı okunamadı, istek engellenmedi: ${err instanceof Error ? err.message : err}`,
      )
      return true
    }
  }

  private async callLlm(systemPrompt: string, messages: ChatMessage[], maxTokens = 400): Promise<string> {
    const keys = this.llm.getKeys('chat')
    if (!keys.length) {
      this.logger.error('LLM_CHAT_KEYS / LLM_API_KEY tanımlı değil')
      throw new ServiceUnavailableException('Chatbot şu anda kullanılamıyor')
    }

    if (!(await this.consumeDailyBudget())) {
      throw new LlmBudgetExceededError()
    }

    const { res, data } = await this.llm.call(keys, {
      model: LLM_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-12)],
      max_tokens: maxTokens,
      temperature: 0.3,
    })

    const content = data?.choices?.[0]?.message?.content
    if (!res?.ok || typeof content !== 'string' || !content.trim()) {
      this.logger.error(`LLM yanıtı kullanılamadı (durum: ${res?.status ?? 'ağ hatası'})`)
      throw new ServiceUnavailableException('Yanıt alınamadı, lütfen tekrar deneyin')
    }
    // Cevap geçmişe geri döneceği için modeli de sanitize et; ayraç vb. kalıntılar
    // sonraki isteklerde injection filtresine takılmasın
    return sanitizeContent(content)
  }

  // LLM judge (4.2): heuristiklerin göremediği Latin alfabeli sızıntıları ucuz 8B
  // çağrısıyla yakalar. Judge erişilemez/anlaşılmaz ise fail-open — bütçe sayacıyla
  // aynı felsefe: dil saflığı uğruna chatbot susturulmaz.
  // consumeDailyBudget bilinçli olarak ÇAĞRILMAZ: her judge zaten bütçelenmiş bir
  // üretim çağrısına 1:1 bağlıdır, toplam LLM kullanımı bütçe×MAX_CHAT_ATTEMPTS ile sınırlıdır.
  private async isTurkishByJudge(text: string): Promise<boolean> {
    const { res, data } = await this.llm.call(this.llm.getKeys('chat'), {
      model: LLM_FALLBACK_MODEL,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: judgeUserMessage(text) },
      ],
      max_tokens: 8,
      temperature: 0,
    })

    const verdict = data?.choices?.[0]?.message?.content
    if (!res?.ok || typeof verdict !== 'string' || !verdict.trim()) {
      this.logger.warn(`Dil denetçisine ulaşılamadı, yanıt kabul edildi (durum: ${res?.status ?? 'ağ hatası'})`)
      return true
    }
    // Karar metnin herhangi bir yerinde aranır ("Karar: HAYIR" gibi süslemeler
    // startsWith'i kaçırıyordu); HAYIR öncelikli — yanlış HAYIR en kötü bir fazladan
    // yeniden üretim tetikler, yanlış EVET ise sızıntıyı denetimsiz geçirir
    const normalized = verdict.trim().toUpperCase()
    if (normalized.includes('HAYIR')) return false
    if (!normalized.includes('EVET')) {
      this.logger.warn(`Dil denetçisi beklenmedik yanıt verdi, kabul edildi: "${verdict.slice(0, 40)}"`)
    }
    return true
  }

  // Deterministik guard'lar (ucuz) önce; onlar temiz derse son söz judge'ın.
  // allowedAmounts: kullanıcının kendi mesajlarında geçen TL tutarları (ör.
  // faturasını tekrarlaması) hasPriceLeak'te sızıntı sayılmaz.
  private async isLeaky(text: string, allowedAmounts: readonly number[]): Promise<boolean> {
    if (isContaminated(text)) return true
    if (hasPriceLeak(text, allowedAmounts)) return true
    return !(await this.isTurkishByJudge(text))
  }

  // Fiyat sorulan turlarda kategori + tek girdiyi (fatura/HP/kW/şarj tipi) çıkarır.
  // Rakamı ASLA üretmez — o iş resolveQuote'ta. Her hata yolunda (anahtar yok /
  // bütçe dolu / non-ok / JSON yok / bozuk JSON / kategori "yok") null döner ve
  // çağıran normal LLM akışına düşer (fail-open, judge'daki felsefenin aynısı).
  //
  // Bütçe notu: bu çağrı consumeDailyBudget()'i TÜKETİR (deterministik yolda
  // üretim çağrısı yapılmadığından günlük bütçenin tek kapısı budur). Bütçe
  // zaten dolmuşsa null döner, çağıran normal üretime düşer ve callLlm'taki
  // ikinci consumeDailyBudget çağrısı da dolu bulup BUDGET_EXCEEDED_MESSAGE'a düşürür.
  private async extractPricingIntent(messages: ChatMessage[]): Promise<PricingInput | null> {
    const keys = this.llm.getKeys('chat')
    if (!keys.length) return null
    if (!(await this.consumeDailyBudget())) return null

    const { res, data } = await this.llm.call(keys, {
      model: LLM_MODEL,
      messages: [{ role: 'system', content: PRICING_EXTRACTION_PROMPT }, ...messages.slice(-12)],
      max_tokens: 150,
      temperature: 0,
    })

    const content = data?.choices?.[0]?.message?.content
    if (!res?.ok || typeof content !== 'string') return null

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    let raw: unknown
    try {
      raw = JSON.parse(jsonMatch[0])
    } catch {
      return null
    }

    const dto = plainToInstance(PricingExtractionDto, raw)
    const errors = await validate(dto, { whitelist: true })
    if (errors.length) {
      for (const err of errors) Reflect.deleteProperty(dto, err.property)
    }
    if (!dto.kategori || dto.kategori === 'yok') return null

    return {
      kategori: dto.kategori as PricingCategory,
      aylikFatura: dto.aylikFatura,
      pompaHp: dto.pompaHp,
      kw: dto.kw,
      sarjTipi: dto.sarjTipi as EvSarjTipi | undefined,
    }
  }

  // Kullanıcıya göstermeden en fazla bu kadar üretim denenir; hepsi sızarsa sabit
  // mesaja düşülür. 2026-08-17'de canlıda 2 denemenin (ilk + tek retry) ikisi de
  // sızdırıp kullanıcıyı sabit hata mesajıyla baş başa bıraktığı görüldü — üçüncü
  // deneme, ekstra LLM bütçesi karşılığında bu sert düşüşü nadirleştirir.
  private static readonly MAX_CHAT_ATTEMPTS = 3

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      // Son mesaja değil, son 12 mesajlık pencereye (callLlm'a gidenle aynı
      // pencere) bakılır: fiyat genelde bir turda sorulup girdi (fatura/HP/kW)
      // sonraki turda salt rakam olarak geliyor — o turda "fiyat" kelimesi hiç
      // geçmeyebilir (canlıda görüldü, 2026-09-02).
      const priceAsked = messages
        .slice(-12)
        .some(m => m.role === 'user' && PRICE_INTENT_PATTERN.test(m.content))
      if (priceAsked) {
        const intent = await this.extractPricingIntent(messages)
        const quote = intent && resolveQuote(intent)
        if (quote) return formatQuoteMessage(quote)
      }

      const allowedAmounts = extractTlAmounts(
        messages.filter(m => m.role === 'user').map(m => m.content).join(' '),
      )

      for (let attempt = 1; attempt <= ChatService.MAX_CHAT_ATTEMPTS; attempt++) {
        // İlk deneme düz sistem promptuyla, sonrakiler düzeltici talimatla yapılır
        // (kör tekrar aynı sızıntıyı yeniden üretebiliyor)
        const systemPrompt = attempt === 1 ? SYSTEM_PROMPT : `${SYSTEM_PROMPT}\n\n${RETRY_NUDGE}`
        const reply = await this.callLlm(systemPrompt, messages, 400)
        if (!(await this.isLeaky(reply, allowedAmounts))) return reply

        const isLastAttempt = attempt === ChatService.MAX_CHAT_ATTEMPTS
        this.logger.warn(
          isLastAttempt
            ? `${attempt}. denemede de sızıntı, sabit mesaja düşürüldü: "${reply.slice(0, 120)}"`
            : `Yabancı dil sızıntısı (deneme ${attempt}/${ChatService.MAX_CHAT_ATTEMPTS}), yanıt yeniden üretiliyor: "${reply.slice(0, 120)}"`,
        )
      }
      return 'Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?'
    } catch (err) {
      // Bütçe dolduğunda hata yerine normal cevap gibi sabit mesaj dön;
      // frontend'de WhatsApp butonu görünür kalır
      if (err instanceof LlmBudgetExceededError) return BUDGET_EXCEEDED_MESSAGE
      throw err
    }
  }

  async generateSummary(messages: ChatMessage[]): Promise<string> {
    let text: string
    try {
      text = await this.callLlm(SUMMARY_PROMPT, messages, 300)
    } catch (err) {
      // Frontend 503'te düz wa.me linkine düşüyor; bütçe aşımında da aynı yol
      if (err instanceof LlmBudgetExceededError) {
        throw new ServiceUnavailableException('Özet oluşturulamadı')
      }
      throw err
    }
    // Özet bilinçli olarak foreign-word ön-filtresine girmez (şablon markalı terim
    // içerir); alfabe kontrolü + judge yeterli
    if (hasNonLatinLeak(text) || !(await this.isTurkishByJudge(text))) {
      // Frontend hata durumunda düz wa.me linkine düşüyor; bozuk özeti mesaj yapma
      this.logger.warn(`Türkçe olmayan özet reddedildi: "${text.slice(0, 120)}"`)
      throw new ServiceUnavailableException('Özet oluşturulamadı')
    }
    return text
  }
}
