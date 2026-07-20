import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

// Taslak içerik yalnızca listeden gizlenmekle kalmaz, doğrudan slug URL'inden de
// okunamamalı. Regresyon: projects.findBySlug'da published filtresi yoktu ve
// GET /api/projects/:slug taslak projeyi 200 + tam gövde ile döndürüyordu
// (blog aynı yeri baştan beri doğru yapıyordu). Slug proje adından deterministik
// üretildiği (toSlug) için tahmin edilebilir; liste gizlemesi tek başına koruma değil.
//
// DİKKAT: Project entity'sinde published DB default'u TRUE (blog'da false).
// Bu yüzden taslak proje oluştururken published:false AÇIKÇA gönderilmeli —
// yoksa proje yayınlanmış olarak doğar ve test hiçbir şey kanıtlamaz.
describe('Unpublished content is not publicly readable (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let cookie: string
  let projectId: string
  let blogId: string

  const PROJECT_SLUG = 'e2e-taslak-proje'
  const BLOG_SLUG = 'e2e-taslak-yazi'

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

    const project = await request(server)
      .post('/api/projects')
      .set('Cookie', cookie)
      .send({
        slug: PROJECT_SLUG,
        name: 'Taslak proje',
        location: 'Çanakkale',
        kw: 10,
        date: '2026',
        description: 'e2e published filtresi testi',
        published: false, // entity default true — açıkça geçilmeli
      })
      .expect(201)
    projectId = project.body.id
    expect(project.body.published).toBe(false)

    const post = await request(server)
      .post('/api/blog')
      .set('Cookie', cookie)
      .send({ title: 'Taslak yazı', slug: BLOG_SLUG, content: '<p>x</p>', published: false })
      .expect(201)
    blogId = post.body.id
  })

  afterAll(async () => {
    if (projectId) {
      await request(server).delete(`/api/projects/${projectId}`).set('Cookie', cookie)
    }
    if (blogId) {
      await request(server).delete(`/api/blog/${blogId}`).set('Cookie', cookie)
    }
    await app.close()
  })

  it('hides the draft project from the public list', async () => {
    const res = await request(server).get('/api/projects').expect(200)
    const slugs = (res.body as Array<{ slug: string }>).map(p => p.slug)
    expect(slugs).not.toContain(PROJECT_SLUG)
  })

  it('returns 404 for a draft project fetched by slug', async () => {
    await request(server).get(`/api/projects/${PROJECT_SLUG}`).expect(404)
  })

  it('returns 404 for a draft blog post fetched by slug', async () => {
    await request(server).get(`/api/blog/${BLOG_SLUG}`).expect(404)
  })

  it('serves the project by slug once it is published (cache invalidation)', async () => {
    await request(server)
      .patch(`/api/projects/${projectId}`)
      .set('Cookie', cookie)
      .send({ published: true })
      .expect(200)

    const res = await request(server).get(`/api/projects/${PROJECT_SLUG}`).expect(200)
    expect(res.body.slug).toBe(PROJECT_SLUG)
  })

  it('returns 404 again after the project is unpublished', async () => {
    await request(server)
      .patch(`/api/projects/${projectId}`)
      .set('Cookie', cookie)
      .send({ published: false })
      .expect(200)

    await request(server).get(`/api/projects/${PROJECT_SLUG}`).expect(404)
  })
})
