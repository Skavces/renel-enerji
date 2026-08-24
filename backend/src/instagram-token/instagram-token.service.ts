import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Cron } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import { AppSetting } from './app-setting.entity'
import { fetchWithTimeout } from '../common/fetch-with-timeout'
import { EncryptionService } from '../common/encryption.service'
import { redactSecretValue, redactUrlSecrets } from '../common/redact'
import { errorMessage } from '../common/errors'

const TOKEN_KEY = 'instagram_access_token'
const REFRESHED_AT_KEY = 'instagram_token_refreshed_at'
const REFRESH_INTERVAL_DAYS = 30

@Injectable()
export class InstagramTokenService implements OnModuleInit {
  private readonly logger = new Logger(InstagramTokenService.name)

  constructor(
    @InjectRepository(AppSetting) private readonly settingRepo: Repository<AppSetting>,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  async onModuleInit() {
    await this.refreshIfNeeded()
  }

  async getAccessToken(): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key: TOKEN_KEY } })
    if (setting?.value) {
      if (this.encryption.isEncrypted(setting.value)) {
        return this.encryption.decrypt(setting.value)
      }
      // Legacy düz metin kayıt — ilk okumada şifreleyip kalıcı hale getir (TOTP ile aynı desen)
      await this.settingRepo.update(TOKEN_KEY, { value: this.encryption.encrypt(setting.value) })
      return setting.value
    }
    return this.config.get<string>('INSTAGRAM_ACCESS_TOKEN') || ''
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
        // Meta'nın hata gövdesi bazı durumlarda sunulan token'ı yankılayabilir;
        // sorgu-parametre deseninin yakalayamayacağı bu çıplak değeri de sök.
        const body = redactSecretValue(await res.text(), currentToken)
        this.logger.error(`Token yenileme başarısız (${res.status}): ${redactUrlSecrets(body)}`)
        return
      }

      const data = await res.json()
      if (!data.access_token) {
        this.logger.error('API yanıtında access_token alanı yok')
        return
      }

      await this.settingRepo.upsert(
        [
          { key: TOKEN_KEY, value: this.encryption.encrypt(data.access_token) },
          { key: REFRESHED_AT_KEY, value: new Date().toISOString() },
        ],
        ['key'],
      )

      const expiresInDays = Math.round((data.expires_in ?? 0) / 86400)
      this.logger.log(`Instagram access token yenilendi — ${expiresInDays} gün geçerli`)
    } catch (err) {
      // errorMessage ile daralt: undici'nin ham hata nesnesi (cause zincirinde
      // istek URL'i taşıyabilir) doğrudan loglanmasın. DbLogger.stringify
      // yalnızca DB kopyasını korur, ConsoleLogger stderr'e ham mesajı basar —
      // bu yüzden redaksiyon burada, çağrı yerinde yapılıyor.
      const message = redactUrlSecrets(redactSecretValue(errorMessage(err), currentToken))
      this.logger.error(`Token yenileme hatası: ${message}`)
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
