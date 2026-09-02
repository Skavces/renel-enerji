import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { LlmService, LLM_MODEL, LLM_FALLBACK_MODEL } from './llm.service'

// 2026-09-02: Groq, chatbot'un kullandığı iki modeli haber vermeden kaldırdı;
// canlı chatbot muhtemelen haftalarca hiç fark edilmeden her mesaja hata
// döndürdü. Sağlayıcı OpenRouter'a geçip sınıf adları genelleştirildikten
// sonra da bu günlük kontrol korundu: gerçek müşteri trafiği olmasa bile
// modellerin hâlâ erişilebilir olduğunu düzenli test eder. Yalnızca sorun
// varsa loglar (Loglar sayfası ERROR/WARN yakalar, bkz. DbLogger) — ikisi de
// çalışıyorsa sessiz kalır.
@Injectable()
export class LlmHealthService {
  private readonly logger = new Logger(LlmHealthService.name)

  constructor(private llm: LlmService) {}

  @Cron('0 9 * * *')
  async checkModelsAvailable(): Promise<void> {
    const keys = this.llm.getKeys('chat')
    if (!keys.length) {
      this.logger.error('LLM sağlık kontrolü atlandı: LLM_CHAT_KEYS / LLM_API_KEY tanımlı değil')
      return
    }

    const [primaryOk, fallbackOk] = await Promise.all([
      this.llm.ping(keys[0], LLM_MODEL),
      this.llm.ping(keys[0], LLM_FALLBACK_MODEL),
    ])

    if (!primaryOk && !fallbackOk) {
      this.logger.error(
        `LLM sağlık kontrolü: hem ana model (${LLM_MODEL}) hem yedek model (${LLM_FALLBACK_MODEL}) ` +
        'yanıt vermiyor — chatbot muhtemelen tamamen çalışmıyor',
      )
    } else if (!primaryOk) {
      this.logger.error(
        `LLM sağlık kontrolü: ana model (${LLM_MODEL}) yanıt vermiyor, chatbot her istekte yedek modele ` +
        `(${LLM_FALLBACK_MODEL}) düşüyor`,
      )
    } else if (!fallbackOk) {
      this.logger.error(
        `LLM sağlık kontrolü: yedek model (${LLM_FALLBACK_MODEL}) yanıt vermiyor — dil denetçisi ve ` +
        'retry güvenlik ağı devre dışı kalabilir',
      )
    }
  }
}
