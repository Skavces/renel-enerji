import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { ProjectMedia } from './entities/project-media.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(ProjectMedia)
    private mediaRepo: Repository<ProjectMedia>,
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
    const existing = await this.projectRepo.findOne({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Bu slug zaten kullanımda')
    const project = this.projectRepo.create(dto)
    return this.projectRepo.save(project)
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id)
    if (dto.slug && dto.slug !== project.slug) {
      const existing = await this.projectRepo.findOne({ where: { slug: dto.slug } })
      if (existing) throw new ConflictException('Bu slug zaten kullanımda')
    }
    Object.assign(project, dto)
    return this.projectRepo.save(project)
  }

  async remove(id: string) {
    const project = await this.findById(id)
    await this.projectRepo.remove(project)
  }

  async reorderProjects(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => this.projectRepo.update(id, { sortOrder: index })),
    )
  }

  async addMedia(projectId: string, type: string, src: string) {
    const project = await this.findById(projectId)
    const count = await this.mediaRepo.count({ where: { project: { id: projectId } } })
    const media = this.mediaRepo.create({ project, type, src, sortOrder: count })
    return this.mediaRepo.save(media)
  }

  async removeMedia(projectId: string, mediaId: string) {
    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, project: { id: projectId } },
    })
    if (!media) throw new NotFoundException('Medya bulunamadı')
    await this.mediaRepo.remove(media)
  }

  async reorderMedia(projectId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.mediaRepo.update({ id, project: { id: projectId } }, { sortOrder: index }),
      ),
    )
    return this.findById(projectId)
  }
}
