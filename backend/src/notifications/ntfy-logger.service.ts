import { ConsoleLogger, Injectable } from '@nestjs/common'
import { NtfyService } from './ntfy.service'

// Uygulama genelinde Logger.error çağrılarını ntfy'ye kopyalayan logger.
// main.ts'te app.useLogger(app.get(NtfyLogger)) ile devreye girer.
@Injectable()
export class NtfyLogger extends ConsoleLogger {
  constructor(private readonly ntfy: NtfyService) {
    super()
  }

  error(message: any, ...optionalParams: any[]): void {
    super.error(message, ...optionalParams)
    // Nest konvansiyonu: son parametre çok satırlı değilse context adıdır (örn. "ChatService")
    const last = optionalParams[optionalParams.length - 1]
    const context = typeof last === 'string' && !last.includes('\n') ? last : undefined
    const text = typeof message === 'string' ? message : JSON.stringify(message)
    void this.ntfy.notifyError(`❌ ${context ? `[${context}] ` : ''}${text}`)
  }
}
