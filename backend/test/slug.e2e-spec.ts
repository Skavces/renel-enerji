import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

// GET :slug rotaları admin/* sabit rotalarıyla aynı controller'da yaşıyor;
// "admin" slug'ıyla içerik oluşturulamamalı (bkz. common/reserved-slugs.ts)
describe('Reserved slug guard (e2e)', () => {
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

  it('rejects a blog post with the reserved admin slug', async () => {
    const res = await request(server)
      .post('/api/blog')
      .set('Cookie', cookie)
      .send({ title: 'Admin denemesi', slug: 'admin', content: '<p>x</p>' })
      .expect(400)

    expect(JSON.stringify(res.body.message)).toContain('rezerve')
  })

  it('rejects a project with the reserved admin slug', async () => {
    await request(server)
      .post('/api/projects')
      .set('Cookie', cookie)
      .send({
        slug: 'admin',
        name: 'Admin denemesi',
        location: 'Çanakkale',
        kw: 10,
        date: '2026',
        description: 'test',
      })
      .expect(400)
  })

  it('rejects the reserved slug on update as well (PartialType inherits the rule)', async () => {
    const created = await request(server)
      .post('/api/blog')
      .set('Cookie', cookie)
      .send({ title: 'Normal yazı', slug: 'normal-yazi-slug-testi', content: '<p>x</p>' })
      .expect(201)

    await request(server)
      .patch(`/api/blog/${created.body.id}`)
      .set('Cookie', cookie)
      .send({ slug: 'admin' })
      .expect(400)

    await request(server).delete(`/api/blog/${created.body.id}`).set('Cookie', cookie).expect(204)
  })
})
