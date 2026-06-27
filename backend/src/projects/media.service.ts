import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { MediaType, ProjectMedia } from './entities/project-media.entity'

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(ProjectMedia)
    private mediaRepo: Repository<ProjectMedia>,
  ) {}

  private async findProjectById(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id } })
    if (!project) throw new NotFoundException('Proje bulunamadı')
    return project
  }

  async addMedia(projectId: string, type: MediaType, src: string) {
    const project = await this.findProjectById(projectId)
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
    await this.mediaRepo.manager.transaction(async (manager) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          manager.update(ProjectMedia, { id, project: { id: projectId } }, { sortOrder: index }),
        ),
      )
    })
  }
}
