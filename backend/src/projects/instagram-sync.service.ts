import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ProjectsService } from './projects.service'

@Injectable()
export class InstagramSyncService {
  private readonly logger = new Logger(InstagramSyncService.name)

  constructor(private readonly projectsService: ProjectsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Instagram sync başlatıldı')
    try {
      const result = await this.projectsService.syncInstagram(true)
      this.logger.log(`Instagram sync tamamlandı: ${result.imported} eklendi, ${result.skipped} atlandı`)
    } catch (err) {
      this.logger.error('Instagram sync hatası', err)
    }
  }
}
