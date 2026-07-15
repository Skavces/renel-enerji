import { Global, Inject, Injectable, Logger, Module, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

// Uygulama genelinde tek paylaşılan ioredis client'ı. Servisler kendi
// bağlantılarını kurmak yerine bu token'ı inject eder; testlerde düz bir
// mock obje vermek yeterli olur.
export const REDIS_CLIENT = 'REDIS_CLIENT'

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit().catch(() => {})
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService): Redis => {
        const logger = new Logger(RedisModule.name)
        const client = new Redis(cfg.get<string>('REDIS_URL') ?? 'redis://localhost:6379')
        client.on('error', err => logger.error('Redis bağlantı hatası', err))
        return client
      },
    },
    RedisShutdown,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
