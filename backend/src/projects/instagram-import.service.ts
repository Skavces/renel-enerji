import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import sharp from 'sharp'
import { createWriteStream } from 'fs'
import { rm } from 'fs/promises'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { join } from 'path'
import { Project } from './entities/project.entity'
import { MediaType } from './entities/project-media.entity'
import { ProjectsService } from './projects.service'
import { MediaService } from './media.service'
import { InstagramParseService } from './instagram-parse.service'
import { InstagramTokenService } from '../instagram-token/instagram-token.service'
import { fetchWithTimeout } from '../common/fetch-with-timeout'
import { UPLOADS_DIR } from '../upload/uploaded-files'

const INSTAGRAM_API_VERSION = 'v21.0'
const INSTAGRAM_MEDIA_FIELDS =
  'id,caption,media_url,thumbnail_url,media_type,timestamp,children{id,media_url,media_type,thumbnail_url}'

@Injectable()
export class InstagramImportService {
  private readonly logger = new Logger(InstagramImportService.name)

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
  ) {}

  getSyncStatus() {
    return this.syncStatus
  }

  startSyncInstagram() {
    if (this.syncStatus.running) {
      return { status: 'already_running' }
    }
    this.syncStatus.running = true
    this.syncStatus.lastError = null
    this.syncInstagram()
      .then(r => {
        this.syncStatus.lastResult = r
        this.syncStatus.lastRun = new Date()
        this.logger.log(`Sync tamamlandı: ${r.imported} eklendi, ${r.skipped} atlandı`)
      })
      .catch((err: any) => {
        this.syncStatus.lastError = err.message
        this.logger.error(`Sync hatası: ${err.message}`)
      })
      .finally(() => { this.syncStatus.running = false })
    return { status: 'started' }
  }

  async syncInstagram(autoPublish = false): Promise<{ imported: number; skipped: number }> {
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
    const data = await res.json()
    const posts: any[] = (data.data ?? []).filter(
      (p: any) => p.caption?.toLowerCase().includes(hashtag),
    )

    // Batch query — tek sorguda tüm mevcut postları bul (N+1 yerine 1 sorgu)
    const postIds = posts.map(p => p.id)
    const existing = await this.projectRepo.find({
      where: { instagramMediaId: In(postIds) },
      select: ['instagramMediaId'],
    })
    const existingIds = new Set(existing.map(p => p.instagramMediaId))
    const newPosts = posts.filter(p => !existingIds.has(p.id))

    let imported = 0
    let skipped = posts.length - newPosts.length
    let parseErrors = 0

    for (const post of newPosts) {
      let parsed: any
      try {
        parsed = await this.parseService.parseInstagram(post.caption)
      } catch (err: any) {
        this.logger.warn(`Parse hatası (post ${post.id}): ${err.message}`)
        parseErrors++
        skipped++
        continue
      }

      await this.createProjectFromInstagram(parsed, post, autoPublish)
      imported++
    }

    this.logger.log(`Sync özet: ${imported} eklendi, ${skipped - parseErrors} zaten var, ${parseErrors} parse hatası`)
    return { imported, skipped }
  }

  async syncInstagramByMediaId(mediaId: string): Promise<void> {
    const already = await this.projectRepo.findOne({ where: { instagramMediaId: mediaId } })
    if (already) {
      this.logger.log(`Instagram post ${mediaId} zaten kayıtlı, atlanıyor`)
      return
    }

    const token = await this.tokenService.getAccessToken()
    if (!token) throw new InternalServerErrorException('INSTAGRAM_ACCESS_TOKEN tanımlı değil')

    const url =
      `https://graph.instagram.com/${INSTAGRAM_API_VERSION}/${mediaId}` +
      `?fields=${INSTAGRAM_MEDIA_FIELDS}`

    const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new InternalServerErrorException(`Instagram API hatası: ${await res.text()}`)

    const post = await res.json()
    const hashtag = this.config.get<string>('INSTAGRAM_HASHTAG', '#proje').toLowerCase()
    if (!post.caption?.toLowerCase().includes(hashtag)) {
      this.logger.log(`Instagram post ${mediaId} ${hashtag} etiketi yok, atlanıyor`)
      return
    }

    let parsed: any
    try {
      parsed = await this.parseService.parseInstagram(post.caption)
    } catch (err: any) {
      throw new InternalServerErrorException(`Parse hatası: ${err.message}`)
    }

    const saved = await this.createProjectFromInstagram(parsed, post, true)
    this.logger.log(`Webhook ile proje oluşturuldu: ${saved.slug}`)
  }

  private async createProjectFromInstagram(parsed: any, post: any, published: boolean): Promise<Project> {
    const slug = await this.projectsService.uniqueSlug(this.projectsService.toSlug(parsed.name))
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
      category: parsed.category || null,
      published,
      instagramMediaId: post.id,
    }

    let saved: Project
    try {
      saved = await this.projectRepo.manager.transaction(async manager => {
        const project = manager.create(Project, projectData)
        return manager.save(project)
      })
    } catch (err: any) {
      if (err.code === '23505') {
        this.logger.warn(`Instagram post ${post.id} zaten kayıtlı (race condition), atlanıyor`)
        const existing = await this.projectRepo.findOne({ where: { instagramMediaId: post.id } })
        if (existing) return existing
      }
      throw err
    }

    await this.importInstagramImages(saved, post)
    return saved
  }

  private async importInstagramImages(project: Project, post: any): Promise<void> {
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
    for (const item of items) {
      try {
        const r = await fetchWithTimeout(item.url, undefined, 30000)
        if (!r.ok) continue

        if (item.type === MediaType.VIDEO) {
          if (!r.body) continue
          const filename = `${project.slug}-ig-${Date.now()}-${Math.round(Math.random() * 1e4)}.mp4`
          const filePath = join(UPLOADS_DIR, filename)
          try {
            // Videoyu RAM'e almadan doğrudan diske akıt
            await pipeline(Readable.fromWeb(r.body as any), createWriteStream(filePath))
          } catch (err) {
            await rm(filePath, { force: true })
            throw err
          }
          await this.mediaService.addMedia(project.id, MediaType.VIDEO, `/uploads/${filename}`)
        } else {
          const buf = Buffer.from(await r.arrayBuffer())
          const filename = `${project.slug}-ig-${Date.now()}-${Math.round(Math.random() * 1e4)}.webp`
          await sharp(buf).webp({ quality: 82 }).toFile(join(UPLOADS_DIR, filename))
          await this.mediaService.addMedia(project.id, MediaType.IMAGE, `/uploads/${filename}`)
        }
      } catch (err: any) {
        this.logger.warn(`Instagram medya indirilemedi (${item.url}): ${err.message}`)
      }
    }
  }
}
