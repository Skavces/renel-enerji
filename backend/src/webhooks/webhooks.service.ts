import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac, timingSafeEqual } from 'crypto'
import { InstagramImportService } from '../projects/instagram-import.service'
import type { InstagramWebhookBody } from '../projects/instagram-types'

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly importService: InstagramImportService,
  ) {}

  verifySignature(rawBody: Buffer, signature: string): boolean {
    const appSecret = this.config.get<string>('INSTAGRAM_APP_SECRET')
    if (!appSecret || !signature) return false
    const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    } catch {
      return false
    }
  }

  // İmza controller'da doğrulanır; buradan sonrası (Graph API + medya indirme +
  // sharp) isteği bekletmeden arka planda koşar. Meta 200'ü hemen alır, böylece
  // timeout kaynaklı yeniden gönderimler ve çift indirme logları biter.
  handleInstagramEvent(body: InstagramWebhookBody): void {
    if (body?.object !== 'instagram') return

    const mediaIds: string[] = []
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'feed') continue
        const value = change.value
        if (value?.verb !== 'add') continue

        const mediaId = value?.media?.id
        if (mediaId) mediaIds.push(mediaId)
      }
    }

    if (mediaIds.length) void this.processMediaIds(mediaIds)
  }

  private async processMediaIds(mediaIds: string[]): Promise<void> {
    for (const mediaId of mediaIds) {
      this.logger.log(`Yeni Instagram gönderisi algılandı: ${mediaId}`)
      try {
        await this.importService.syncInstagramByMediaId(mediaId)
      } catch (err: any) {
        this.logger.error(`syncInstagramByMediaId hatası (${mediaId}): ${err.message}`)
      }
    }
  }
}
