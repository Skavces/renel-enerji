import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { AuthService } from './auth/auth.service'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    @InjectDataSource() private dataSource: DataSource,
    private authService: AuthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { connection: this.dataSource }),
      () => this.checkRedis(),
    ])
  }

  // Redis auth (jti blacklist) için zorunlu bağımlılık; kopuksa health 503 dönmeli
  private async checkRedis(): Promise<HealthIndicatorResult> {
    try {
      await this.authService.pingRedis()
      return { redis: { status: 'up' } }
    } catch (err) {
      throw new HealthCheckError('Redis erişilemiyor', {
        redis: { status: 'down', message: err instanceof Error ? err.message : String(err) },
      })
    }
  }
}
