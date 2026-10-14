import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Cron } from '@nestjs/schedule'
import { In, Repository } from 'typeorm'
import sharp from 'sharp'
import { createWriteStream } from 'fs'
import { rm } from 'fs/promises'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { join } from 'path'
import { Project } from './entities/project.entity'
import { InstagramSkippedMedia } from './entities/instagram-skipped-media.entity'
import { MediaType } from './entities/project-media.entity'
import { ProjectsService } from './projects.service'
import { MediaService } from './media.service'
import { InstagramParseService } from './instagram-parse.service'
import { InstagramTokenService } from '../instagram-token/instagram-token.service'
import { fetchWithTimeout } from '../common/fetch-with-timeout'
import { fetchAllowedMedia } from '../common/media-fetch'
import { PublicCacheService } from '../common/public-cache.service'
import { errorMessage, isUniqueViolation } from '../common/errors'
import { UPLOADS_DIR } from '../upload/uploaded-files'
import { ALLOWED_IMAGE_MIMES, assertMagicBytes, assertMagicBytesFromBuffer } from '../upload/upload.utils'
import type { InstagramMediaListResponse, InstagramPost, ParsedProject } from './instagram-types'

const INSTAGRAM_API_VERSION = 'v21.0'
const INSTAGRAM_MEDIA_FIELDS =
  'id,caption,media_url,thumbnail_url,media_type,timestamp,children{id,media_url,media_type,thumbnail_url}'
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
// Parse'ı bu kadar başarısız olan post otomatik sync'te atlanır (her 30 dk'da
// bir boşuna LLM çağrısı yapılmasın); manuel sync her zaman yeniden dener
const MAX_AUTO_PARSE_FAILURES = 3

type SyncTrigger = 'manual' | 'scheduled'

// Video akışı diske yazılırken RAM'e alınmadan sayılır — sınır aşılırsa
// pipeline'ı throw ile keser (disk doldurma koruması)
async function* limitBytes(source: AsyncIterable<Buffer>, maxBytes: number): AsyncGenerator<Buffer> {
  let total = 0
  for await (const chunk of source) {
    total += chunk.length
    if (total > maxBytes) throw new Error(`Video boyutu sınırı aşıldı (${maxBytes} bayt)`)
    yield chunk
  }
}

@Injectable()
export class InstagramImportService {
  private readonly logger = new Logger(InstagramImportService.name)

  private autoSyncFailing = false

  private readonly syncStatus = {
    running: false,
    lastRun: null as Date | null,
    lastResult: null as { imported: number; skipped: number } | null,
    lastError: null as string | null,
  }

  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private projectsService: ProjectsService,
    private mediaService: MediaService,
    private parseService: InstagramParseService,
    private tokenService: InstagramTokenService,
    private config: ConfigService,
    private cache: PublicCacheService,
    @InjectRepository(InstagramSkippedMedia)
    private skippedRepo: Repository<InstagramSkippedMedia>,
  ) {}

  getSyncStatus() {
    return this.syncStatus
  }

  startSyncInstagram() {
    if (this.syncStatus.running) {
      return { status: 'already_running' }
    }
    void this.runSync('manual')
    return { status: 'started' }
  }

  // Webhook (feed/add) Meta panelinde abone edilemediği için yeni #proje postları
  // periyodik sync ile yakalanır. Postlar taslak düşer; yayına admin karar verir.
  @Cron('*/30 * * * *')
  async scheduledSync(): Promise<void> {
    if (this.syncStatus.running) return
    const userId = this.config.get<string>('INSTAGRAM_USER_ID')
    const token = await this.tokenService.getAccessToken()
    if (!token || !userId) {
      this.logger.debug('Instagram oto-sync atlandı: token veya INSTAGRAM_USER_ID tanımlı değil')
      return
    }
    await this.runSync('scheduled')
  }

  private async runSync(trigger: SyncTrigger): Promise<void> {
    this.syncStatus.running = true
    this.syncStatus.lastError = null
    try {
      const r = await this.syncInstagram({ trigger })
      this.syncStatus.lastResult = r
      this.syncStatus.lastRun = new Date()
      if (trigger === 'manual' || r.imported > 0) {
        this.logger.log(`Sync tamamlandı (${trigger}): ${r.imported} eklendi, ${r.skipped} atlandı`)
      }
      if (trigger === 'scheduled' && this.autoSyncFailing) {
        this.autoSyncFailing = false
        this.logger.log('Instagram oto-sync tekrar çalışıyor')
      }
    } catch (err) {
      this.syncStatus.lastError = errorMessage(err)
      // Token ölürse günde 48 aynı hata Loglar sayfasını doldurmasın: oto-sync
      // yalnızca ilk hatada loglar, düzelince bir kez bildirir
      if (trigger === 'manual' || !this.autoSyncFailing) {
        this.logger.error(`Sync hatası (${trigger}): ${errorMessage(err)}`)
      }
      if (trigger === 'scheduled') this.autoSyncFailing = true
    } finally {
      this.syncStatus.running = false
    }
  }

  async syncInstagram(
    opts: { autoPublish?: boolean; trigger?: SyncTrigger } = {},
  ): Promise<{ imported: number; skipped: number }> {
    const { autoPublish = false, trigger = 'manual' } = opts
    const token = await this.tokenService.getAccessToken()
    const userId = this.config.get<string>('INSTAGRAM_USER_ID')
    if (!token || !userId) {
      throw new InternalServerErrorException('INSTAGRAM_ACCESS_TOKEN veya INSTAGRAM_USER_ID .env dosyasında tanımlı değil')
    }

    const apiUrl =
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${userId}/media` +
      `?fields=${INSTAGRAM_MEDIA_FIELDS}&limit=50`

    const res = await fetchWithTimeout(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new InternalServerErrorException(`Instagram API hatası: ${await res.text()}`)

    const hashtag = this.config.get<string>('INSTAGRAM_HASHTAG', '#proje').toLowerCase()
    const data: InstagramMediaListResponse = await res.json()
    const posts = (data.data ?? []).filter(
      p => p.caption?.toLowerCase().includes(hashtag),
    )

    // Batch query — tek sorguda tüm mevcut postları bul (N+1 yerine 1 sorgu)
    const postIds = posts.map(p => p.id)
    const existing = await this.projectRepo.find({
      where: { instagramMediaId: In(postIds) },
      select: ['instagramMediaId'],
    })
    const existingIds = new Set(existing.map(p => p.instagramMediaId))

    // Silinen / tekrar tekrar parse'ı başarısız olan postlar tekrar içeri alınmaz
    const skipRecords = new Map<string, InstagramSkippedMedia>()
    if (postIds.length) {
      const records = await this.skippedRepo.find({ where: { mediaId: In(postIds) } })
      for (const r of records) skipRecords.set(r.mediaId, r)
    }
    const newPosts = posts.filter(p => {
      if (existingIds.has(p.id)) return false
      const rec = skipRecords.get(p.id)
      if (!rec) return true
      if (rec.reason === 'deleted') return false
      return !(trigger === 'scheduled' && rec.failCount >= MAX_AUTO_PARSE_FAILURES)
    })

    let imported = 0
    let skipped = posts.length - newPosts.length
    let parseErrors = 0

    for (const post of newPosts) {
      let parsed: ParsedProject
      try {
        parsed = await this.parseService.parseInstagram(post.caption ?? '')
      } catch (err) {
        this.logger.warn(`Parse hatası (post ${post.id}): ${errorMessage(err)}`)
        await this.recordParseFailure(post.id, skipRecords.get(post.id)?.failCount ?? 0, err)
        parseErrors++
        skipped++
        continue
      }

      await this.createProjectFromInstagram(parsed, post, autoPublish)
      if (skipRecords.has(post.id)) await this.skippedRepo.delete({ mediaId: post.id })
      imported++
    }

    if (trigger === 'manual' || imported > 0 || parseErrors > 0) {
      this.logger.log(`Sync özet: ${imported} eklendi, ${skipped - parseErrors} zaten var, ${parseErrors} parse hatası`)
    }
    return { imported, skipped }
  }

  async syncInstagramByMediaId(mediaId: string): Promise<void> {
    const already = await this.projectRepo.findOne({ where: { instagramMediaId: mediaId } })
    if (already) {
      this.logger.log(`Instagram post ${mediaId} zaten kayıtlı, atlanıyor`)
      return
    }

    const skipRecord = await this.skippedRepo.findOne({ where: { mediaId } })
    if (skipRecord?.reason === 'deleted') {
      this.logger.log(`Instagram post ${mediaId} admin tarafından silinmiş, atlanıyor`)
      return
    }

    const token = await this.tokenService.getAccessToken()
    if (!token) throw new InternalServerErrorException('INSTAGRAM_ACCESS_TOKEN tanımlı değil')

    const url =
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${mediaId}` +
      `?fields=${INSTAGRAM_MEDIA_FIELDS}`

    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new InternalServerErrorException(`Instagram API hatası: ${await res.text()}`)

    const post: InstagramPost = await res.json()
    const hashtag = this.config.get<string>('INSTAGRAM_HASHTAG', '#proje').toLowerCase()
    if (!post.caption?.toLowerCase().includes(hashtag)) {
      this.logger.log(`Instagram post ${mediaId} ${hashtag} etiketi yok, atlanıyor`)
      return
    }

    let parsed: ParsedProject
    try {
      parsed = await this.parseService.parseInstagram(post.caption ?? '')
    } catch (err) {
      throw new InternalServerErrorException(`Parse hatası: ${errorMessage(err)}`)
    }

    const saved = await this.createProjectFromInstagram(parsed, post, true)
    this.logger.log(`Webhook ile proje oluşturuldu: ${saved.slug}`)
  }

  // Sayaç kaydı sync'i düşürmemeli: DB hatası yalnızca uyarı olarak loglanır
  private async recordParseFailure(mediaId: string, previousCount: number, err: unknown): Promise<void> {
    try {
      await this.skippedRepo.save({
        mediaId,
        reason: 'parse_failed',
        failCount: previousCount + 1,
        lastError: errorMessage(err).slice(0, 500),
      })
    } catch (saveErr) {
      this.logger.warn(`Parse hata sayacı yazılamadı (post ${mediaId}): ${errorMessage(saveErr)}`)
    }
  }

  private async createProjectFromInstagram(parsed: ParsedProject, post: InstagramPost, published: boolean): Promise<Project> {
    const slug = await this.projectsService.uniqueSlug(this.projectsService.toSlug(parsed.name ?? ''))
    const projectData = {
      slug,
      name: parsed.name || 'Instagram Proje',
      location: parsed.location || '',
      kw: parsed.kw || 0,
      date: parsed.date || String(new Date().getFullYear()),
      description: parsed.description || '',
      about: parsed.about || '',
      specs: parsed.specs || [],
      highlights: parsed.highlights || [],
      statBoxes: parsed.statBoxes || [],
      category: parsed.category || undefined,
      // Medya importu bitmeden yayınlanmaz: süreç yarıda kalırsa sitede medyasız
      // proje görünmesin (published parametresi yalnızca yayınlama niyetidir)
      published: false,
      instagramMediaId: post.id,
    }

    let saved: Project
    try {
      saved = await this.projectRepo.manager.transaction(async manager => {
        const project = manager.create(Project, projectData)
        return manager.save(project)
      })
    } catch (err) {
      if (isUniqueViolation(err)) {
        this.logger.warn(`Instagram post ${post.id} zaten kayıtlı (race condition), atlanıyor`)
        const existing = await this.projectRepo.findOne({ where: { instagramMediaId: post.id } })
        if (existing) return existing
      }
      throw err
    }

    const mediaCount = await this.importInstagramImages(saved, post)
    if (published && mediaCount > 0) {
      await this.projectRepo.update(saved.id, { published: true })
      saved.published = true
      // ProjectsService'i bypass eden tek yayına alma yolu; public cache burada düşürülür
      this.cache.bust('projects')
    } else if (published) {
      this.logger.warn(`Instagram post ${post.id}: hiç medya indirilemedi, proje taslakta bırakıldı (${saved.slug})`)
    }
    return saved
  }

  // Başarıyla eklenen medya sayısını döner; yayınlama kararı buna bakar
  private async importInstagramImages(project: Project, post: InstagramPost): Promise<number> {
    const items: { url: string; type: MediaType }[] = []

    if (post.media_type === 'IMAGE' && post.media_url) {
      items.push({ url: post.media_url, type: MediaType.IMAGE })
    } else if (post.media_type === 'VIDEO' && post.media_url) {
      if (post.thumbnail_url) items.push({ url: post.thumbnail_url, type: MediaType.THUMBNAIL })
      items.push({ url: post.media_url, type: MediaType.VIDEO })
    } else if (post.media_type === 'CAROUSEL_ALBUM') {
      for (const child of post.children?.data ?? []) {
        if (child.media_type === 'IMAGE' && child.media_url) {
          items.push({ url: child.media_url, type: MediaType.IMAGE })
        } else if (child.media_type === 'VIDEO' && child.media_url) {
          if (child.thumbnail_url) items.push({ url: child.thumbnail_url, type: MediaType.THUMBNAIL })
          items.push({ url: child.media_url, type: MediaType.VIDEO })
        }
      }
    }

    // Sıralı indirme: paralel indirme + video buffer'lama 512MB container'da
    // carousel'li postlarda OOM'a yol açabiliyordu
    let imported = 0
    for (const item of items) {
      try {
        const r = await fetchAllowedMedia(item.url, 30000)
        if (!r.ok) continue

        if (item.type === MediaType.VIDEO) {
          if (!r.body) continue
          const filename = `${project.slug}-ig-${Date.now()}-${Math.round(Math.random() * 1e4)}.mp4`
          const filePath = join(UPLOADS_DIR, filename)
          try {
            // Videoyu RAM'e almadan doğrudan diske akıt
            // undici'nin body tipi lib.dom ReadableStream'i; Node'un stream/web
            // tipiyle yapısal olarak aynı ama nominal olarak farklı — cast şart
            await pipeline(
              limitBytes(
                Readable.fromWeb(r.body as unknown as import('stream/web').ReadableStream<Uint8Array>),
                MAX_VIDEO_BYTES,
              ),
              createWriteStream(filePath),
            )
            // İçerik hiç kontrol edilmeden herkese açık /uploads/ altına yazılmasın
            await assertMagicBytes(filePath, ['video/mp4'])
          } catch (err) {
            await rm(filePath, { force: true })
            throw err
          }
          await this.mediaService.addMedia(project.id, MediaType.VIDEO, `/uploads/${filename}`)
        } else {
          const buf = Buffer.from(await r.arrayBuffer())
          await assertMagicBytesFromBuffer(buf, ALLOWED_IMAGE_MIMES)
          const filename = `${project.slug}-ig-${Date.now()}-${Math.round(Math.random() * 1e4)}.webp`
          await sharp(buf).webp({ quality: 82 }).toFile(join(UPLOADS_DIR, filename))
          await this.mediaService.addMedia(project.id, MediaType.IMAGE, `/uploads/${filename}`)
        }
        imported++
      } catch (err) {
        this.logger.warn(`Instagram medya indirilemedi (${item.url}): ${errorMessage(err)}`)
      }
    }
    return imported
  }
}
