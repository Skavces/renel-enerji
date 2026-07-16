import { Test } from '@nestjs/testing'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DataSource } from 'typeorm'
import type Redis from 'ioredis'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/configure-app'
import { REDIS_CLIENT } from '../src/redis/redis.module'
import { AdminConfig } from '../src/auth/admin-config.entity'

// Prod bootstrap'la aynı HTTP davranışı: configureApp main.ts ile paylaşılır.
// Migration'lar TypeORM migrationsRun:true ile init sırasında otomatik koşar.
export async function createE2eApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication<NestExpressApplication>()
  configureApp(app)
  app.enableShutdownHooks()
  await app.init()
  return app
}

// Spec dosyaları aynı throwaway DB'yi paylaşır (--runInBand); her spec kendi
// beforeAll'unda admin durumunu sıfırlar ki dosya sırası önemsiz olsun.
export async function resetAdminConfig(app: NestExpressApplication): Promise<void> {
  await app
    .get(DataSource)
    .getRepository(AdminConfig)
    .update({ id: 1 }, { totpSecret: null, username: null, passwordHash: null, tokenVersion: 0 })
}

// Önceki spec'lerden kalan blacklist/otp-replay anahtarlarını temizler
// (REDIS_URL setup-e2e.ts'te 6380'deki throwaway redis'e sabitlenmiştir)
export async function flushTestRedis(app: NestExpressApplication): Promise<void> {
  await app.get<Redis>(REDIS_CLIENT).flushdb()
}

// login yanıtındaki Set-Cookie başlığından admin_token cookie'sini çıkarır
export function extractAdminCookie(setCookie: string[] | string | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []
  const token = cookies.find(c => c.startsWith('admin_token='))
  if (!token) throw new Error('admin_token cookie bulunamadı')
  return token.split(';')[0]
}
