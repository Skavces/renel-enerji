import { Inject, Injectable, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '../redis/redis.module'
import type { ChatMessage } from './chat.service'

const KEY_PREFIX = 'chat:history:'
// Sohbet penceresi kapansa da kısa süreli devam edebilsin; KVKK açısından
// kalıcı veri değil (lead kaydı ayrı, 6 ay saklama orada)
const HISTORY_TTL_SECONDS = 60 * 60
// Eski istemci kontratındaki ArrayMaxSize(20) ile aynı üst sınır
export const HISTORY_MAX_MESSAGES = 20

// Assistant yanıtı max_tokens:400 ile sınırlı (~1.6k karakter), kullanıcı mesajı
// DTO'da MaxLength(1000) — 4000 bolca pay bırakır, meşru mesajı asla elemez
const MAX_CONTENT_LENGTH = 4000

// Redis'ten okunan geçmiş yalnızca dizi olup olmadığı kontrol edilip cast
// edilmesin diye eleman-seviyesi şekil doğrulaması. 'system' rolünü kabul
// etmemesi kritik: chat.service.ts prompt'u [{role:'system',...}, ...history]
// şeklinde kuruyor, doğrulamasız bir history 'system' mesajı LLM'e ikinci
// bir sistem talimatı gibi geçebilirdi.
function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false
  const { role, content } = value as Record<string, unknown>
  return (
    (role === 'user' || role === 'assistant') &&
    typeof content === 'string' &&
    content.length <= MAX_CONTENT_LENGTH
  )
}

// Konuşma geçmişi sunucuda tutulur: istemci yalnızca yeni kullanıcı mesajını
// gönderir, sahte assistant mesajıyla modelin yönlendirilmesi imkânsızlaşır.
// Redis hatalarında fail-open: geçmiş kaybolur ama chatbot cevap vermeye devam eder.
@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name)

  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  async load(sessionId: string): Promise<ChatMessage[]> {
    try {
      const raw = await this.redis.get(KEY_PREFIX + sessionId)
      if (!raw) return []
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed) || !parsed.every(isChatMessage)) {
        this.logger.warn(`Chat geçmişi bozuk şekilli, sıfırlandı (${sessionId})`)
        return []
      }
      return parsed.slice(-HISTORY_MAX_MESSAGES)
    } catch (err) {
      this.logger.warn(
        `Chat geçmişi okunamadı (${sessionId}): ${err instanceof Error ? err.message : err}`,
      )
      return []
    }
  }

  async save(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
      const trimmed = messages.slice(-HISTORY_MAX_MESSAGES)
      await this.redis.set(
        KEY_PREFIX + sessionId,
        JSON.stringify(trimmed),
        'EX',
        HISTORY_TTL_SECONDS,
      )
    } catch (err) {
      this.logger.warn(
        `Chat geçmişi yazılamadı (${sessionId}): ${err instanceof Error ? err.message : err}`,
      )
    }
  }
}
