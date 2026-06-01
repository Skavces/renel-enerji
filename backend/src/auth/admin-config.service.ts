import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AdminConfig } from './admin-config.entity'

@Injectable()
export class AdminConfigService {
  constructor(
    @InjectRepository(AdminConfig)
    private repo: Repository<AdminConfig>,
  ) {}

  async getConfig(): Promise<AdminConfig> {
    let config = await this.repo.findOne({ where: { id: 1 } })
    if (!config) {
      config = this.repo.create({ id: 1, totpSecret: null })
      await this.repo.save(config)
    }
    return config
  }

  async setTotpSecret(secret: string): Promise<void> {
    await this.repo.upsert({ id: 1, totpSecret: secret }, ['id'])
  }

  async removeTotpSecret(): Promise<void> {
    await this.repo.upsert({ id: 1, totpSecret: null }, ['id'])
  }

  async setUsername(username: string): Promise<void> {
    await this.repo.upsert({ id: 1, username }, ['id'])
  }

  async setPasswordHash(passwordHash: string): Promise<void> {
    await this.repo.upsert({ id: 1, passwordHash }, ['id'])
  }
}
