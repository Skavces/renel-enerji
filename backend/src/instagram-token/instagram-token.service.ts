import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { AppSetting } from './app-setting.entity'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

const TOKEN_KEY = 'instagram_access_token'
const REFRESHED_AT_KEY = 'instagram_token_refreshed_at'
const REFRESH_INTERVAL_DAYS = 30

@Injectable()
export class InstagramTokenService implements OnModuleInit {
  private readonly logger = new Logger(InstagramTokenService.name)

  constructor(
    @InjectRepository(AppSetting) private readonly settingRepo: Repository<AppSetting>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.refreshIfNeeded()
  }

  async getAccessToken(): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key: TOKEN_KEY } })
    return setting?.value || this.config.get<string>('INSTAGRAM_ACCESS_TOKEN') || ''
  }

  // Her ayın 1'i saat 03:00'da çalışır
  @Cron('0 3 1 * *')
  async refresh(): Promise<void> {
    const currentToken = await this.getAccessToken()
    if (!currentToken) {
      this.logger.warn('Instagram access token bulunamadı, yenileme atlandı')
      return
    }

    try {
      const url =
        `https://graph.instagram.com/refresh_access_token` +
        `?grant_type=ig_refresh_token&access_token=${currentToken}`

      const res = await fetchWithTimeout(url)
      if (!res.ok) {
        this.logger.error(`Token yenileme başarısız (${res.status}): ${await res.text()}`)
        return
      }

      const data = await res.json()
      if (!data.access_token) {
        this.logger.error('API yanıtında access_token alanı yok')
        return
      }

      await this.settingRepo.upsert(
        [
          { key: TOKEN_KEY, value: data.access_token },
          { key: REFRESHED_AT_KEY, value: new Date().toISOString() },
        ],
        ['key'],
      )

      const expiresInDays = Math.round((data.expires_in ?? 0) / 86400)
      this.logger.log(`Instagram access token yenilendi — ${expiresInDays} gün geçerli`)
    } catch (err) {
      this.logger.error('Token yenileme hatası', err)
    }
  }

  private async refreshIfNeeded(): Promise<void> {
    const setting = await this.settingRepo.findOne({ where: { key: REFRESHED_AT_KEY } })
    if (setting) {
      const daysSince = (Date.now() - new Date(setting.value).getTime()) / 86_400_000
      if (daysSince < REFRESH_INTERVAL_DAYS) {
        this.logger.log(`Token ${Math.round(daysSince)} gün önce yenilendi, yenileme atlandı`)
        return
      }
    }
    await this.refresh()
  }
}
