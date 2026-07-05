import { ConsoleLogger, Injectable } from '@nestjs/common'
import { TelegramService } from './telegram.service'

// Uygulama genelinde Logger.error çağrılarını Telegram'a kopyalayan logger.
// main.ts'te app.useLogger(app.get(TelegramLogger)) ile devreye girer.
@Injectable()
export class TelegramLogger extends ConsoleLogger {
  constructor(private readonly telegram: TelegramService) {
    super()
  }

  error(message: any, ...optionalParams: any[]): void {
    super.error(message, ...optionalParams)
    // Nest konvansiyonu: son parametre çok satırlı değilse context adıdır (örn. "ChatService")
    const last = optionalParams[optionalParams.length - 1]
    const context = typeof last === 'string' && !last.includes('\n') ? last : undefined
    const text = typeof message === 'string' ? message : JSON.stringify(message)
    void this.telegram.notifyError(`❌ ${context ? `[${context}] ` : ''}${text}`)
  }
}
