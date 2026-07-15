import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdminConfig } from './admin-config.entity'
import { EncryptionService } from '../common/encryption.service'

const ADMIN_CONFIG_ID = 1
// jwt.strategy her korumalı istekte getConfig çağırır; kısa TTL'li cache ile
// istek yolundaki DB round-trip'i kalkar. Yazan metodlar cache'i düşürdüğü için
// TTL yalnızca DB'ye elle müdahale gibi dış değişikliklerde gecikme yaratır.
// (Tek instance varsayımı bilinçli — yatay ölçeklemede Redis'e taşınmalı.)
const CACHE_TTL_MS = 60_000

@Injectable()
export class AdminConfigService implements OnModuleInit {
  private cache: { value: AdminConfig; expiresAt: number } | null = null

  constructor(
    @InjectRepository(AdminConfig)
    private repo: Repository<AdminConfig>,
    private encryption: EncryptionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureRow()
  }

  // Satır yoksa oluştur; varsa HİÇBİR kolona dokunma. upsert({ totpSecret: null })
  // kullanılamaz: null overwrite kolonuna girer ve kayıtlı secret'ı siler.
  private async ensureRow(): Promise<void> {
    await this.repo.createQueryBuilder()
      .insert()
      .values({ id: ADMIN_CONFIG_ID })
      .orIgnore()
      .execute()
  }

  async getConfig(): Promise<AdminConfig> {
    if (this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.value
    }

    let config = await this.repo.findOne({ where: { id: ADMIN_CONFIG_ID } })
    if (!config) {
      // Normalde satır onModuleInit'te garanti edilir; bu yol yalnızca satırın
      // sonradan silinmesi gibi durumlara karşı güvenlik ağı
      await this.ensureRow()
      config = await this.repo.findOne({ where: { id: ADMIN_CONFIG_ID } })
      if (!config) throw new Error('admin_config satırı okunamadı')
    }
    if (config.totpSecret) {
      if (this.encryption.isEncrypted(config.totpSecret)) {
        config.totpSecret = this.encryption.decrypt(config.totpSecret)
      } else {
        // Legacy düz metin kayıt — ilk okumada şifreleyip kalıcı hale getir
        await this.repo.update(ADMIN_CONFIG_ID, {
          totpSecret: this.encryption.encrypt(config.totpSecret),
        })
      }
    }
    this.cache = { value: config, expiresAt: Date.now() + CACHE_TTL_MS }
    return config
  }

  async setTotpSecret(secret: string): Promise<void> {
    await this.repo.upsert(
      { id: ADMIN_CONFIG_ID, totpSecret: this.encryption.encrypt(secret) },
      ['id'],
    )
    this.cache = null
  }

  async removeTotpSecret(): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, totpSecret: null }, ['id'])
    this.cache = null
  }

  async setUsername(username: string): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, username }, ['id'])
    this.cache = null
  }

  async setPasswordHash(passwordHash: string): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, passwordHash }, ['id'])
    this.cache = null
  }

  // Kimlik bilgisi değişiminde çağrılır; tüm mevcut oturumları geçersiz kılar
  async incrementTokenVersion(): Promise<void> {
    await this.repo.increment({ id: ADMIN_CONFIG_ID }, 'tokenVersion', 1)
    this.cache = null
  }
}
