import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ProjectsService } from './projects.service'

@Injectable()
export class InstagramSyncService {
  private readonly logger = new Logger(InstagramSyncService.name)

  constructor(private readonly projectsService: ProjectsService) {}

  // Webhook yokken kaçırılan postları günde bir yakalar
  @Cron('0 4 * * *')
  async handleCron() {
    this.logger.log('Instagram günlük sync başlatıldı')
    try {
      const result = await this.projectsService.syncInstagram(true)
      this.logger.log(`Instagram sync tamamlandı: ${result.imported} eklendi, ${result.skipped} atlandı`)
    } catch (err) {
      this.logger.error('Instagram sync hatası', err)
    }
  }
}
