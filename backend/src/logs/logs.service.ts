import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron } from '@nestjs/schedule'
import { MoreThan, Repository } from 'typeorm'
import { AppLog, LogLevel } from './entities/app-log.entity'

// Loglar sayfasında gösterilen saklama süresi; değişirse purge cron'u ile senkron kalmalı
export const LOG_RETENTION_INTERVAL = '30 days'

const MESSAGE_LIMIT = 4000
const LIST_LIMIT = 200
const DAY_MS = 24 * 60 * 60 * 1000

export interface LogStats {
  total: number
  errors24h: number
  warns24h: number
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name)

  constructor(
    @InjectRepository(AppLog)
    private repo: Repository<AppLog>,
  ) {}

  // DİKKAT: DbLogger'ın error/warn kancasından çağrılıyor. Burada Nest Logger
  // KULLANILMAZ — sonsuz döngü oluşur. Kendi hataları console'a yazılır.
  async record(level: LogLevel, message: string, context?: string): Promise<void> {
    try {
      await this.repo.insert({
        level,
        context: context ?? null,
        message: message.slice(0, MESSAGE_LIMIT),
      })
    } catch (err) {
      console.error('Log kaydı yazılamadı:', err instanceof Error ? err.message : err)
    }
  }

  async findAllWithStats(level?: LogLevel): Promise<{ stats: LogStats; logs: AppLog[] }> {
    const cutoff = new Date(Date.now() - DAY_MS)
    const [logs, total, errors24h, warns24h] = await Promise.all([
      this.repo.find({
        where: level ? { level } : {},
        order: { createdAt: 'DESC' },
        take: LIST_LIMIT,
      }),
      this.repo.count(),
      this.repo.count({ where: { level: 'error', createdAt: MoreThan(cutoff) } }),
      this.repo.count({ where: { level: 'warn', createdAt: MoreThan(cutoff) } }),
    ])
    return { stats: { total, errors24h, warns24h }, logs }
  }

  @Cron('30 4 * * *')
  async purgeOldLogs(): Promise<void> {
    try {
      const result = await this.repo
        .createQueryBuilder()
        .delete()
        .where(`"createdAt" < now() - interval '${LOG_RETENTION_INTERVAL}'`)
        .execute()
      if ((result.affected ?? 0) > 0) {
        this.logger.log(`Log temizliği: ${result.affected} eski kayıt silindi`)
      }
    } catch (err) {
      this.logger.error(`Log temizliği başarısız: ${err instanceof Error ? err.message : err}`)
    }
  }
}
