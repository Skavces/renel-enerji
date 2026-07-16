import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

describe('Auth (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>

  beforeAll(async () => {
    app = await createE2eApp()
    server = app.getHttpServer()
    await resetAdminConfig(app)
    await flushTestRedis(app)
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejects a wrong password with 401 and sets no cookie', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: 'yanlis-sifre' })
      .expect(401)

    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('logs in, receives an httpOnly cookie and reaches /auth/me', async () => {
    // Nest, @Res kullanan POST handler'larda da varsayılan 201'i uygular
    const login = await request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD })
      .expect(201)

    expect(login.body).toEqual({ success: true })
    // Node runtime'da set-cookie her zaman dizidir; supertest tipleri string der
    const rawCookies = login.headers['set-cookie'] as unknown as string[]
    expect(rawCookies[0]).toContain('HttpOnly')
    const cookie = extractAdminCookie(rawCookies)

    const me = await request(server).get('/api/auth/me').set('Cookie', cookie).expect(200)
    expect(me.body).toEqual({ ok: true, username: E2E_ADMIN_USERNAME })
  })

  it('blacklists the token on logout so the same cookie stops working', async () => {
    const login = await request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD })
      .expect(201)
    const cookie = extractAdminCookie(login.headers['set-cookie'])

    await request(server).get('/api/auth/me').set('Cookie', cookie).expect(200)
    await request(server).post('/api/auth/logout').set('Cookie', cookie).expect(201)
    // jti Redis blacklist'ine yazıldı; cookie hâlâ elimizde ama artık geçersiz
    await request(server).get('/api/auth/me').set('Cookie', cookie).expect(401)
  })

  it('rejects a tampered token', async () => {
    await request(server)
      .get('/api/auth/me')
      .set('Cookie', 'admin_token=eyJhbGciOiJIUzI1NiJ9.sahte.imza')
      .expect(401)
  })
})
