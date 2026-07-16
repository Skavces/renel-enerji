import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

// Reorder gerçek Postgres şemasına karşı koşulmalı: projects reorder'ı elle
// yazılmış `sort_order` kolon adı yüzünden gerçek şemada patlıyordu ve hiçbir
// unit test bunu yakalayamadı (mock'lar SQL'i çalıştırmaz).
describe('Reorder (e2e)', () => {
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

  it('persists a new blog post order through the CASE update', async () => {
    const ids: string[] = []
    for (const n of [1, 2, 3]) {
      const res = await request(server)
        .post('/api/blog')
        .set('Cookie', cookie)
        .send({ title: `Sıralama ${n}`, slug: `e2e-siralama-${n}`, content: '<p>x</p>' })
        .expect(201)
      ids.push(res.body.id)
    }

    const reversed = [...ids].reverse()
    await request(server)
      .patch('/api/blog/reorder')
      .set('Cookie', cookie)
      .send({ orderedIds: reversed })
      .expect(200)

    const all = await request(server).get('/api/blog/admin/all').set('Cookie', cookie).expect(200)
    const listedIds = (all.body as Array<{ id: string }>).map(p => p.id).filter(id => ids.includes(id))
    expect(listedIds).toEqual(reversed)

    for (const id of ids) {
      await request(server).delete(`/api/blog/${id}`).set('Cookie', cookie).expect(204)
    }
  })

  it('persists a new project order (regression: broken sort_order column literal)', async () => {
    const ids: string[] = []
    for (const n of [1, 2, 3]) {
      const res = await request(server)
        .post('/api/projects')
        .set('Cookie', cookie)
        .send({
          slug: `e2e-proje-siralama-${n}`,
          name: `Sıralama projesi ${n}`,
          location: 'Çanakkale',
          kw: 10,
          date: '2026',
          description: 'e2e reorder testi',
        })
        .expect(201)
      ids.push(res.body.id)
    }

    const reversed = [...ids].reverse()
    await request(server)
      .patch('/api/projects/reorder')
      .set('Cookie', cookie)
      .send({ orderedIds: reversed })
      .expect(200)

    const all = await request(server).get('/api/projects/admin/all').set('Cookie', cookie).expect(200)
    const listedIds = (all.body as Array<{ id: string }>).map(p => p.id).filter(id => ids.includes(id))
    expect(listedIds).toEqual(reversed)

    for (const id of ids) {
      await request(server).delete(`/api/projects/${id}`).set('Cookie', cookie).expect(204)
    }
  })
})
