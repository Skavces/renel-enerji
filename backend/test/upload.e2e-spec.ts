import { NestExpressApplication } from '@nestjs/platform-express'
import request from 'supertest'
import { readdir, unlink } from 'fs/promises'
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_USERNAME } from './setup-e2e'
import { createE2eApp, extractAdminCookie, flushTestRedis, resetAdminConfig } from './e2e-utils'

// 1x1 şeffaf piksel — gerçek PNG magic byte'larıyla mutlu yol testi için
const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

// Multer cwd'ye göre ./uploads kullanır; jest cwd = backend/
const UPLOADS_DIR = './uploads'

describe('Blog cover upload (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let cookie: string
  let postId: string

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

    const post = await request(server)
      .post('/api/blog')
      .set('Cookie', cookie)
      .send({ title: 'E2E test yazısı', slug: 'e2e-test-yazisi', content: '<p>içerik</p>' })
      .expect(201)
    postId = post.body.id
  })

  afterAll(async () => {
    if (postId) {
      await request(server).delete(`/api/blog/${postId}`).set('Cookie', cookie).expect(204)
    }
    await app.close()
  })

  it('rejects the upload without a cookie', async () => {
    await request(server)
      .post(`/api/upload/blog/${postId}/cover`)
      .attach('file', REAL_PNG, 'kapak.png')
      .expect(401)
  })

  it('rejects a text file masquerading as PNG and leaves no file behind', async () => {
    const before = await readdir(UPLOADS_DIR)

    const res = await request(server)
      .post(`/api/upload/blog/${postId}/cover`)
      .set('Cookie', cookie)
      // Uzantı ve MIME image/png der ama içerik düz metin — magic byte kontrolü yakalamalı
      .attach('file', Buffer.from('bu dosya aslinda png degil'), 'sahte.png')
      .expect(400)

    expect(res.body.message).toContain('Dosya içeriği izin verilen türlerle eşleşmiyor')

    // 3.2 fixinin teyidi: reddedilen upload'dan geriye dosya kalmaz
    const after = await readdir(UPLOADS_DIR)
    expect(after.sort()).toEqual(before.sort())
  })

  it('accepts a real PNG, converts it to webp and updates the post', async () => {
    const res = await request(server)
      .post(`/api/upload/blog/${postId}/cover`)
      .set('Cookie', cookie)
      .attach('file', REAL_PNG, 'kapak.png')
      .expect(201)

    const coverImage: string = res.body.coverImage
    expect(coverImage).toMatch(/^\/uploads\/e2e-test-yazisi-gunes-enerjisi-\d+\.webp$/)

    // Testin ürettiği dosyayı temizle
    await unlink(`.${coverImage}`)
  })
})

describe('Project media upload (e2e)', () => {
  let app: NestExpressApplication
  let server: ReturnType<NestExpressApplication['getHttpServer']>
  let cookie: string
  let projectId: string

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
        slug: 'e2e-medya-projesi',
        name: 'E2E medya projesi',
        location: 'İzmir',
        kw: 10,
        date: '2026',
        description: 'B.2 regresyon testi',
      })
      .expect(201)
    projectId = project.body.id
  })

  afterAll(async () => {
    if (projectId) {
      await request(server).delete(`/api/projects/${projectId}`).set('Cookie', cookie)
    }
    await app.close()
  })

  it('leaves no file behind when the project does not exist', async () => {
    const before = await readdir(UPLOADS_DIR)

    await request(server)
      .post('/api/upload/projects/00000000-0000-0000-0000-000000000000/media')
      .set('Cookie', cookie)
      .attach('files', REAL_PNG, 'a.png')
      .attach('files', REAL_PNG, 'b.png')
      .attach('files', REAL_PNG, 'c.png')
      .expect(404)

    const after = await readdir(UPLOADS_DIR)
    expect(after.sort()).toEqual(before.sort())
  })

  it('leaves no file behind when one file in the batch fails the magic-byte check', async () => {
    const before = await readdir(UPLOADS_DIR)

    await request(server)
      .post(`/api/upload/projects/${projectId}/media`)
      .set('Cookie', cookie)
      // İlk dosya sahte — hiçbir şey kalıcı olmamalı
      .attach('files', Buffer.from('bu dosya aslinda png degil'), 'sahte.png')
      .attach('files', REAL_PNG, 'b.png')
      .attach('files', REAL_PNG, 'c.png')
      .expect(400)

    const after = await readdir(UPLOADS_DIR)
    expect(after.sort()).toEqual(before.sort())

    const list = await request(server).get('/api/projects/admin/all').set('Cookie', cookie).expect(200)
    const project = (list.body as Array<{ id: string; media: unknown[] }>).find(p => p.id === projectId)
    expect(project?.media ?? []).toEqual([])
  })

  it('accepts a batch of real PNGs and converts each to webp', async () => {
    const res = await request(server)
      .post(`/api/upload/projects/${projectId}/media`)
      .set('Cookie', cookie)
      .attach('files', REAL_PNG, 'a.png')
      .attach('files', REAL_PNG, 'b.png')
      .expect(201)

    expect(res.body).toHaveLength(2)
    for (const media of res.body) {
      expect(media.src).toMatch(/^\/uploads\/e2e-medya-projesi-gunes-enerjisi-\d+-\d+\.webp$/)
      await unlink(`.${media.src}`)
    }
  })
})
