import { ConsoleLogger, Injectable } from '@nestjs/common'
import { LogsService } from './logs.service'
import { redactUrlSecrets } from '../common/redact'

// Uygulama genelinde Logger.error/warn çağrılarını veritabanına kopyalayan logger.
// main.ts'te app.useLogger(app.get(DbLogger)) ile devreye girer; admin panel Loglar sayfası okur.
@Injectable()
export class DbLogger extends ConsoleLogger {
  constructor(private readonly logs: LogsService) {
    super()
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams)
    void this.logs.record('error', this.stringify(message), this.extractContext(optionalParams))
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, ...optionalParams)
    void this.logs.record('warn', this.stringify(message), this.extractContext(optionalParams))
  }

  // Nest konvansiyonu: son parametre çok satırlı değilse context adıdır (örn. "ChatService")
  private extractContext(optionalParams: unknown[]): string | undefined {
    const last = optionalParams[optionalParams.length - 1]
    return typeof last === 'string' && !last.includes('\n') ? last : undefined
  }

  // Savunma derinliği: çağrı yeri sır redaksiyonunu unutsa bile, error/warn'ın
  // veritabanına yazıldığı tek darboğaz burası — sorgu-parametre biçimindeki
  // sırlar burada da maskelenir.
  private stringify(message: unknown): string {
    const text = typeof message === 'string' ? message : JSON.stringify(message)
    return redactUrlSecrets(text)
  }
}
