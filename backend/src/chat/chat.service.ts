import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'
import { GroqService, GROQ_MODEL, GROQ_FALLBACK_MODEL } from '../groq/groq.service'
import { REDIS_CLIENT } from '../redis/redis.module'
import { hasNonLatinLeak, isContaminated, sanitizeContent } from './chat-guards'
import { JUDGE_SYSTEM_PROMPT, RETRY_NUDGE, SUMMARY_PROMPT, SYSTEM_PROMPT } from './chat-prompts'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Günlük Groq bütçesi: kötüye kullanım kotayı bitirip gerçek müşterinin
// chatbot'unu susturmasın diye chatbot yoluna devre kesici konur.
// Instagram parse tarafı bu bütçeden BAĞIMSIZDIR (GroqService'i ayrıca kullanır).
const DEFAULT_DAILY_LIMIT = 1000
const BUDGET_KEY_PREFIX = 'groq:daily:'
const BUDGET_KEY_TTL_SECONDS = 48 * 60 * 60

export const BUDGET_EXCEEDED_MESSAGE =
  'Şu anda yoğunluk nedeniyle yanıt veremiyorum. Aşağıdaki "WhatsApp\'tan Teklif Al" ' +
  'butonuna basarak talebinizi doğrudan bize iletebilirsiniz.'

export class GroqBudgetExceededError extends Error {
  constructor() {
    super('Groq günlük bütçesi aşıldı')
  }
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private config: ConfigService,
    private groq: GroqService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // true → istek bütçeye sığdı; false → günlük limit doldu.
  // Redis erişilemezse fail-open: chatbot bütçe yüzünden hiç susmasın.
  private async consumeDailyBudget(): Promise<boolean> {
    const limit = Number(this.config.get<string>('GROQ_DAILY_LIMIT') ?? DEFAULT_DAILY_LIMIT)
    if (!Number.isFinite(limit) || limit <= 0) return true

    try {
      const key = `${BUDGET_KEY_PREFIX}${new Date().toISOString().slice(0, 10)}`
      const count = await this.redis.incr(key)
      if (count === 1) await this.redis.expire(key, BUDGET_KEY_TTL_SECONDS)
      if (count > limit) {
        // Log seline dönmesin: yalnızca eşiğin aşıldığı ilk istekte error bas
        if (count === limit + 1) this.logger.error(`Groq günlük bütçesi aşıldı (limit: ${limit})`)
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

  private async callGroq(systemPrompt: string, messages: ChatMessage[], maxTokens = 400): Promise<string> {
    const keys = this.groq.getKeys('chat')
    if (!keys.length) {
      this.logger.error('GROQ_CHAT_KEYS / GROQ_API_KEY tanımlı değil')
      throw new ServiceUnavailableException('Chatbot şu anda kullanılamıyor')
    }

    if (!(await this.consumeDailyBudget())) {
      throw new GroqBudgetExceededError()
    }

    const { res, data } = await this.groq.call(keys, {
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages.slice(-12)],
      max_tokens: maxTokens,
      temperature: 0.3,
    })

    const content = data?.choices?.[0]?.message?.content
    if (!res?.ok || typeof content !== 'string' || !content.trim()) {
      this.logger.error(`Groq yanıtı kullanılamadı (durum: ${res?.status ?? 'ağ hatası'})`)
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
  // üretim çağrısına 1:1 bağlıdır, toplam Groq kullanımı bütçe×2 ile sınırlıdır.
  private async isTurkishByJudge(text: string): Promise<boolean> {
    const { res, data } = await this.groq.call(this.groq.getKeys('chat'), {
      model: GROQ_FALLBACK_MODEL,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 4,
      temperature: 0,
    })

    const verdict = data?.choices?.[0]?.message?.content
    if (!res?.ok || typeof verdict !== 'string' || !verdict.trim()) {
      this.logger.warn(`Dil denetçisine ulaşılamadı, yanıt kabul edildi (durum: ${res?.status ?? 'ağ hatası'})`)
      return true
    }
    const normalized = verdict.trim().toUpperCase()
    if (normalized.startsWith('HAYIR')) return false
    if (!normalized.startsWith('EVET')) {
      this.logger.warn(`Dil denetçisi beklenmedik yanıt verdi, kabul edildi: "${verdict.slice(0, 40)}"`)
    }
    return true
  }

  // Deterministik guard'lar (ucuz) önce; onlar temiz derse son söz judge'ın
  private async isLeaky(text: string): Promise<boolean> {
    if (isContaminated(text)) return true
    return !(await this.isTurkishByJudge(text))
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      let reply = await this.callGroq(SYSTEM_PROMPT, messages, 400)
      // İç içe yapı bilinçli: temiz yanıt tek judge çağrısıyla geçsin (ardışık iki
      // if aynı temiz yanıtı iki kez judge'a götürürdü)
      if (await this.isLeaky(reply)) {
        // Kullanıcıya göstermeden tek sefer yeniden üret; kör tekrar aynı sızıntıyı
        // yeniden üretebildiğinden retry'a düzeltici talimat eklenir
        this.logger.warn(`Yabancı dil sızıntısı, yanıt yeniden üretiliyor: "${reply.slice(0, 120)}"`)
        reply = await this.callGroq(`${SYSTEM_PROMPT}\n\n${RETRY_NUDGE}`, messages, 400)
        if (await this.isLeaky(reply)) {
          this.logger.warn(`Yeniden denemede de sızıntı, sabit mesaja düşürüldü: "${reply.slice(0, 120)}"`)
          return 'Üzgünüm, yanıt oluşturulurken bir sorun yaşandı. Sorunuzu tekrar yazar mısınız?'
        }
      }
      return reply
    } catch (err) {
      // Bütçe dolduğunda hata yerine normal cevap gibi sabit mesaj dön;
      // frontend'de WhatsApp butonu görünür kalır
      if (err instanceof GroqBudgetExceededError) return BUDGET_EXCEEDED_MESSAGE
      throw err
    }
  }

  async generateSummary(messages: ChatMessage[]): Promise<string> {
    let text: string
    try {
      text = await this.callGroq(SUMMARY_PROMPT, messages, 300)
    } catch (err) {
      // Frontend 503'te düz wa.me linkine düşüyor; bütçe aşımında da aynı yol
      if (err instanceof GroqBudgetExceededError) {
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
