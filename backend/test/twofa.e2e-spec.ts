import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { authenticator } from 'otplib'
import type Redis from 'ioredis'
import { REDIS_CLIENT } from '../src/redis/redis.module'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

describe('2FA flow (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let redis: Redis

  // Aynı 30sn'lik TOTP penceresinde art arda adımlar aynı kodu üretir; replay
  // koruması (otp:<kod>-<pencere>) ikinci kullanımı reddeder. Testte pencerenin
  // değişmesini beklemek yerine replay anahtarları temizlenir.
  async function clearOtpReplayKeys(): Promise<void> {
    const keys = await redis.keys('otp:*')
    if (keys.length) await redis.del(...keys)
  }

  async function login() {
    return request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD })
      .expect(201)
  }

  beforeAll(async () => {
    app = await createE2eApp()
    server = app.getHttpServer()
    redis = app.get<Redis>(REDIS_CLIENT)
    await resetAdminConfig(app)
    await flushTestRedis(app)
  })

  afterAll(async () => {
    // Sonraki spec dosyaları 2FA'sız admin bekler
    await resetAdminConfig(app)
    await app.close()
  })

  it('runs the full cycle: setup → confirm → login requires 2FA → verify → me', async () => {
    // 2FA kurulu değilken login doğrudan cookie verir
    const firstLogin = await login()
    expect(firstLogin.body).toEqual({ success: true })
    const cookie = extractAdminCookie(firstLogin.headers['set-cookie'])

    const status = await request(server).get('/api/auth/2fa/status').set('Cookie', cookie).expect(200)
    expect(status.body).toEqual({ enabled: false })

    // Setup: secret üret ve gerçek TOTP koduyla onayla
    const setup = await request(server).get('/api/auth/2fa/setup').set('Cookie', cookie).expect(200)
    const secret: string = setup.body.secret
    expect(secret).toBeTruthy()
    expect(setup.body.qrCodeUrl).toMatch(/^data:image\/png;base64,/)

    await request(server)
      .post('/api/auth/2fa/setup/confirm')
      .set('Cookie', cookie)
      .send({ secret, code: authenticator.generate(secret) })
      .expect(201)

    // Artık login cookie yerine preAuthToken döner
    const secondLogin = await login()
    expect(secondLogin.body.requires2fa).toBe(true)
    const preAuthToken: string = secondLogin.body.preAuthToken
    expect(preAuthToken).toBeTruthy()
    expect(secondLogin.headers['set-cookie']).toBeUndefined()

    // K-01: pre-auth token korumalı endpoint'lere erişemez
    await request(server)
      .get('/api/auth/me')
      .set('Cookie', `admin_token=${preAuthToken}`)
      .expect(401)

    // Yanlış kod reddedilir
    await clearOtpReplayKeys()
    await request(server).post('/api/auth/2fa/verify').send({ preAuthToken, code: '000000' }).expect(401)

    // Doğru kodla oturum açılır
    const verify = await request(server)
      .post('/api/auth/2fa/verify')
      .send({ preAuthToken, code: authenticator.generate(secret) })
      .expect(201)
    const fullCookie = extractAdminCookie(verify.headers['set-cookie'])

    const me = await request(server).get('/api/auth/me').set('Cookie', fullCookie).expect(200)
    expect(me.body).toEqual({ ok: true, username: E2E_ADMIN_USERNAME })

    // preAuthToken tek kullanımlıktır (jti blacklist'e yazıldı)
    await clearOtpReplayKeys()
    await request(server)
      .post('/api/auth/2fa/verify')
      .send({ preAuthToken, code: authenticator.generate(secret) })
      .expect(401)
  })
})
