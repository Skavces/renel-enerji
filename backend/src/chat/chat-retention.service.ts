import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron } from '@nestjs/schedule'
import { Repository } from 'typeorm'
import { ChatRating } from './entities/chat-rating.entity'
import { ChatLead } from './entities/chat-lead.entity'

// KVKK aydınlatma metninde taahhüt edilen saklama süresi (frontend/src/pages/Kvkk.jsx ile senkron)
export const RETENTION_INTERVAL = '6 months'

// Satırlar silinmez, yalnızca kişisel veri içeren konuşma dökümü null'lanır;
// böylece puan ortalamaları ve talep istatistikleri korunur.
@Injectable()
export class ChatRetentionService {
  private readonly logger = new Logger(ChatRetentionService.name)

  constructor(
    @InjectRepository(ChatRating)
    private ratings: Repository<ChatRating>,
    @InjectRepository(ChatLead)
    private leads: Repository<ChatLead>,
  ) {}

  @Cron('0 4 * * *')
  async purgeOldTranscripts(): Promise<void> {
    try {
      const [ratingResult, leadResult] = await Promise.all([
        this.purge(this.ratings),
        this.purge(this.leads),
      ])
      if (ratingResult + leadResult > 0) {
        this.logger.log(
          `KVKK temizliği: ${ratingResult} değerlendirme + ${leadResult} talep dökümü anonimleştirildi`,
        )
      }
    } catch (err) {
      this.logger.error(`KVKK temizliği başarısız: ${err instanceof Error ? err.message : err}`)
    }
  }

  private async purge(repo: Repository<ChatRating> | Repository<ChatLead>): Promise<number> {
    const result = await repo
      .createQueryBuilder()
      .update()
      .set({ conversation: null })
      .where('"createdAt" < now() - :retention::interval', { retention: RETENTION_INTERVAL })
      .andWhere('conversation IS NOT NULL')
      .execute()
    return result.affected ?? 0
  }
}
