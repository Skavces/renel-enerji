import { Repository } from 'typeorm'
import { ProjectsService } from '../projects.service'
import { Project } from '../entities/project.entity'
import { MediaType, ProjectMedia } from '../entities/project-media.entity'
import { MediaService } from '../media.service'

function media(type: MediaType, src: string, sortOrder: number): ProjectMedia {
  return { id: src, type, src, sortOrder } as ProjectMedia
}

function makeService(projects: Partial<Project>[]) {
  const repo = {
    find: jest.fn().mockResolvedValue(projects),
  } as unknown as jest.Mocked<Repository<Project>>
  const mediaService = {} as MediaService
  return { service: new ProjectsService(repo, mediaService), repo }
}

describe('ProjectsService.findAllPublic — kapak görseli', () => {
  it('thumbnail varsa yalnızca onu döner', async () => {
    const { service } = makeService([
      {
        id: 'p1',
        media: [
          media(MediaType.IMAGE, '/uploads/a.webp', 0),
          media(MediaType.THUMBNAIL, '/uploads/kapak.webp', 5),
          media(MediaType.VIDEO, '/uploads/v.mp4', 1),
        ],
      },
    ])
    const [project] = await service.findAllPublic()
    expect(project.media).toEqual([media(MediaType.THUMBNAIL, '/uploads/kapak.webp', 5)])
  })

  it('thumbnail yoksa en düşük sortOrder\'lı görseli döner (videolar atlanır)', async () => {
    const { service } = makeService([
      {
        id: 'p1',
        media: [
          media(MediaType.VIDEO, '/uploads/v.mp4', 0),
          media(MediaType.IMAGE, '/uploads/b.webp', 2),
          media(MediaType.IMAGE, '/uploads/a.webp', 1),
        ],
      },
    ])
    const [project] = await service.findAllPublic()
    expect(project.media).toEqual([media(MediaType.IMAGE, '/uploads/a.webp', 1)])
  })

  it('görsel yoksa boş medya dizisi döner', async () => {
    const { service } = makeService([
      { id: 'p1', media: [media(MediaType.VIDEO, '/uploads/v.mp4', 0)] },
      { id: 'p2', media: [] },
    ])
    const result = await service.findAllPublic()
    expect(result[0].media).toEqual([])
    expect(result[1].media).toEqual([])
  })

  it('yalnızca yayınlanmış projeleri sıralı ister', async () => {
    const { service, repo } = makeService([])
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledWith({
      where: { published: true },
      relations: { media: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    })
  })
})
