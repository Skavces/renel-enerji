import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

// 4.4 public cache: invalidation gerçek wiring üzerinden doğrulanır — cache'li
// listeden SONRA yapılan admin mutasyonu public yanıta ANINDA yansımalı
// (bust unutulursa 60sn bayat liste döner ve bu test onu yakalar).
describe('Public content cache (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let cookie: string

  beforeAll(async () => {
    app = await createE2eApp()
    server = app.getHttpServer()
    await resetAdminConfig(app)
    await flushTestRedis(app)

    const login = await request(server)
      .post('/api/auth/login')
      .send({ username: E2E_ADMIN_USERNAME, password: E2E_ADMIN_PASSWORD })
      .expect(201)
    cookie = extractAdminCookie(login.headers['set-cookie'])
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves public lists with a 60s Cache-Control header', async () => {
    const res = await request(server).get('/api/blog').expect(200)
    expect(res.headers['cache-control']).toBe('public, max-age=60')
  })

  it('admin create shows up in the public list immediately (invalidation)', async () => {
    // Listeyi cache'e al
    await request(server).get('/api/blog').expect(200)

    const created = await request(server)
      .post('/api/blog')
      .set('Cookie', cookie)
      .send({ title: 'Cache testi', slug: 'e2e-cache-testi', content: '<p>x</p>', published: true })
      .expect(201)

    const list = await request(server).get('/api/blog').expect(200)
    const slugs = (list.body as Array<{ slug: string }>).map(p => p.slug)
    expect(slugs).toContain('e2e-cache-testi')

    await request(server).delete(`/api/blog/${created.body.id}`).set('Cookie', cookie).expect(204)

    // Silme de bust'lamalı: kayıt public listeden anında düşer
    const after = await request(server).get('/api/blog').expect(200)
    expect((after.body as Array<{ slug: string }>).map(p => p.slug)).not.toContain('e2e-cache-testi')
  })
})
