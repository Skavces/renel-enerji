import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { MediaType, ProjectMedia } from './entities/project-media.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { MediaService } from './media.service'
import { PublicCacheService } from '../common/public-cache.service'
import { RESERVED_SLUGS } from '../common/reserved-slugs'
import { reorderByCase } from '../common/reorder'
import { isUniqueViolation } from '../common/errors'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private mediaService: MediaService,
    private cache: PublicCacheService,
  ) {}

  // Liste sayfası kart başına tek kapak görseli kullanıyor; tüm medya dizisi
  // yerine yalnızca kapak gönderilir (detay sayfası findBySlug ile tam listeyi alır).
  // Kapak seçimi frontend'deki mantıkla birebir: thumbnail > en düşük sortOrder'lı görsel.
  private static coverOnly(media: ProjectMedia[]): ProjectMedia[] {
    const thumb = media.find(m => m.type === MediaType.THUMBNAIL)
    if (thumb) return [thumb]
    const firstImage = [...media]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .find(m => m.type === MediaType.IMAGE)
    return firstImage ? [firstImage] : []
  }

  findAllPublic() {
    return this.cache.wrap('projects:list', async () => {
      const projects = await this.projectRepo.find({
        where: { published: true },
        relations: { media: true },
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      })
      return projects.map(p => ({ ...p, media: ProjectsService.coverOnly(p.media ?? []) }))
    })
  }

  findAll() {
    return this.projectRepo.find({
      relations: { media: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  // published filtresi ŞART: taslak proje listeden gizlense de slug'ı proje
  // adından deterministik üretildiğinden (toSlug) tahmin edilebilir. Filtre
  // olmadan taslaklar doğrudan URL'den okunuyordu (blog aynı yeri baştan beri
  // doğru yapıyordu). Admin taslağı admin/all üzerinden okur, buradan değil.
  findBySlug(slug: string) {
    return this.cache.wrap(`projects:slug:${slug}`, async () => {
      const project = await this.projectRepo.findOne({
        where: { slug, published: true },
        relations: { media: true },
      })
      if (!project) throw new NotFoundException('Proje bulunamadı')
      return project
    })
  }

  async findById(id: string) {
    const project = await this.projectRepo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    return project
  }

  async create(dto: CreateProjectDto) {
    const project = this.projectRepo.create(dto)
    try {
      const saved = await this.projectRepo.save(project)
      this.cache.bust('projects')
      return saved
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException('Bu slug zaten kullanımda')
      throw err
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id)
    Object.assign(project, dto)
    try {
      const saved = await this.projectRepo.save(project)
      this.cache.bust('projects')
      return saved
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException('Bu slug zaten kullanımda')
      throw err
    }
  }

  async remove(id: string) {
    const project = await this.projectRepo.findOne({ where: { id }, relations: { media: true } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    const sources = project.media.map(m => m.src)
    await this.projectRepo.remove(project) // media satırları DB cascade ile silinir
    for (const src of sources) {
      await this.mediaService.deleteFileIfUnreferenced(src)
    }
    this.cache.bust('projects')
  }

  async reorderProjects(orderedIds: string[]) {
    // Eski raw SQL yanlış `sort_order` kolon adıyla runtime'da patlıyordu;
    // helper kolon adlarını metadata'dan aldığından tekrarlayamaz
    await reorderByCase(this.projectRepo, orderedIds)
    this.cache.bust('projects')
  }

  toSlug(name: string): string {
    if (!name) return 'proje'
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'proje'
  }

  async uniqueSlug(base: string): Promise<string> {
    const existing = await this.projectRepo
      .createQueryBuilder('p')
      .select('p.slug')
      .where('p.slug = :base OR p.slug LIKE :pattern', {
        base,
        pattern: `${base}-%`,
      })
      .getMany()

    // Rezerve slug'lar (örn. Instagram importunun ürettiği "admin") doluymuş
    // gibi davranır; base doğal olarak admin-1'e kayar
    const slugs = new Set([...RESERVED_SLUGS, ...existing.map((p) => p.slug)])
    if (!slugs.has(base)) return base
    let n = 1
    while (slugs.has(`${base}-${n}`)) n++
    return `${base}-${n}`
  }
}
