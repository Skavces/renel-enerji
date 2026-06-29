import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdminConfig } from './admin-config.entity'

const ADMIN_CONFIG_ID = 1

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(AdminConfig)
    private repo: Repository<AdminConfig>,
  ) {}

  async getConfig(): Promise<AdminConfig> {
    let config = await this.repo.findOne({ where: { id: ADMIN_CONFIG_ID } })
    if (!config) {
      config = this.repo.create({ id: ADMIN_CONFIG_ID, totpSecret: null })
      await this.repo.save(config)
    }
    return config
  }

  async setTotpSecret(secret: string): Promise<void> {
    await this.repo.upsert({ id: ADMIN_CONFIG_ID, totpSecret: secret }, ['id'])
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
