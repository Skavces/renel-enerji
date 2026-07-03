import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdminConfig } from './admin-config.entity'
import { EncryptionService } from '../common/encryption.service'

const ADMIN_CONFIG_ID = 1

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(AdminConfig)
    private repo: Repository<AdminConfig>,
    private encryption: EncryptionService,
  ) {}

  async getConfig(): Promise<AdminConfig> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, totpSecret: null }, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    })
    const config = await this.repo.findOne({ where: { id: ADMIN_CONFIG_ID } })
    if (config?.totpSecret) {
      if (this.encryption.isEncrypted(config.totpSecret)) {
        config.totpSecret = this.encryption.decrypt(config.totpSecret)
      } else {
        // Legacy düz metin kayıt — ilk okumada şifreleyip kalıcı hale getir
        await this.repo.update(ADMIN_CONFIG_ID, {
          totpSecret: this.encryption.encrypt(config.totpSecret),
        })
      }
    }
    return config
  }

  async setTotpSecret(secret: string): Promise<void> {
    await this.repo.upsert(
      { id: ADMIN_CONFIG_ID, totpSecret: this.encryption.encrypt(secret) },
      ['id'],
    )
  }

  async removeTotpSecret(): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, totpSecret: null }, ['id'])
  }

  async setUsername(username: string): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, username }, ['id'])
  }

  async setPasswordHash(passwordHash: string): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, passwordHash }, ['id'])
  }
}
