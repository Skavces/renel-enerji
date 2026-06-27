import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  findAllPublic() {
    return this.projectRepo.find({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  }

  findAll() {
    return this.projectRepo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } })
  }

  async findBySlug(slug: string) {
    const project = await this.projectRepo.findOne({ where: { slug } })
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
    const project = await this.findById(id)
    await this.projectRepo.remove(project)
  }

  async reorderProjects(orderedIds: string[]) {
    await this.projectRepo.manager.transaction(async (manager) => {
      await Promise.all(
        orderedIds.map((id, index) => manager.update(Project, id, { sortOrder: index })),
      )
    })
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
    let slug = base
    let n = 0
    while (await this.projectRepo.findOne({ where: { slug } })) {
      n++
      slug = `${base}-${n}`
    }
    return slug
  }
}
