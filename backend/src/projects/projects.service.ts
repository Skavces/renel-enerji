import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { MediaService } from './media.service'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private mediaService: MediaService,
  ) {}

  findAllPublic() {
    return this.projectRepo.find({
      where: { published: true },
      relations: { media: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  findAll() {
    return this.projectRepo.find({
      relations: { media: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  async findBySlug(slug: string) {
    const project = await this.projectRepo.findOne({ where: { slug }, relations: { media: true } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    return project
  }

  async findById(id: string) {
    const project = await this.projectRepo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    return project
  }

  async create(dto: CreateProjectDto) {
    const project = this.projectRepo.create(dto)
    try {
      return await this.projectRepo.save(project)
    } catch (err: any) {
      if (err.code === '23505') throw new ConflictException('Bu slug zaten kullanımda')
      throw err
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id)
    Object.assign(project, dto)
    try {
      return await this.projectRepo.save(project)
    } catch (err: any) {
      if (err.code === '23505') throw new ConflictException('Bu slug zaten kullanımda')
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
  }

  async reorderProjects(orderedIds: string[]) {
    if (!orderedIds.length) return
    const cases = orderedIds.map((_, i) => `WHEN $${i + 2} THEN ${i}`).join(' ')
    await this.projectRepo.manager.query(
      `UPDATE projects SET sort_order = CASE id ${cases} END WHERE id = ANY($1)`,
      [orderedIds, ...orderedIds],
    )
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

    const slugs = new Set(existing.map((p) => p.slug))
    if (!slugs.has(base)) return base
    let n = 1
    while (slugs.has(`${base}-${n}`)) n++
    return `${base}-${n}`
  }
}
