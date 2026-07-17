import { Repository } from 'typeorm'
import { ProjectsService } from '../projects.service'
import { Project } from '../entities/project.entity'
import { MediaType, ProjectMedia } from '../entities/project-media.entity'
import { MediaService } from '../media.service'
import { PublicCacheService } from '../../common/public-cache.service'

function media(type: MediaType, src: string, sortOrder: number): ProjectMedia {
  return { id: src, type, src, sortOrder } as ProjectMedia
}

function makeService(projects: Partial<Project>[]) {
  const repo = {
    find: jest.fn().mockResolvedValue(projects),
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((entity: Partial<Project>) => Promise.resolve(entity)),
  } as unknown as jest.Mocked<Repository<Project>>
  const mediaService = {} as MediaService
  return { service: new ProjectsService(repo, mediaService, new PublicCacheService()), repo }
}

function makeSlugService(existingSlugs: string[]) {
  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(existingSlugs.map(slug => ({ slug }))),
  }
  const repo = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  } as unknown as jest.Mocked<Repository<Project>>
  return new ProjectsService(repo, {} as MediaService, new PublicCacheService())
}

describe('ProjectsService.uniqueSlug — rezerve sluglar', () => {
  it('boş slug tablosunda base aynen döner', async () => {
    expect(await makeSlugService([]).uniqueSlug('canakkale-ges')).toBe('canakkale-ges')
  })

  it('çakışan slug numaralanır', async () => {
    expect(await makeSlugService(['canakkale-ges']).uniqueSlug('canakkale-ges')).toBe('canakkale-ges-1')
  })

  it("otomatik üretilen 'admin' slug'ı rezerve olduğundan admin-1'e kayar", async () => {
    // Instagram importu DTO validasyonundan geçmez; koruma burada
    expect(await makeSlugService([]).uniqueSlug('admin')).toBe('admin-1')
  })
})

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

describe('ProjectsService — public cache (4.4)', () => {
  it('liste ikinci çağrıda repo\'ya gitmez', async () => {
    const { service, repo } = makeService([])
    await service.findAllPublic()
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledTimes(1)
  })

  it('update hem listeyi hem slug cache\'ini düşürür', async () => {
    const { service, repo } = makeService([])
    repo.findOne.mockResolvedValue({ id: 'p1', slug: 'ges' } as Project)
    await service.findAllPublic()
    await service.findBySlug('ges')
    await service.update('p1', { name: 'Yeni ad' })
    await service.findAllPublic()
    await service.findBySlug('ges')
    expect(repo.find).toHaveBeenCalledTimes(2)
    // findOne: slug + update içindeki findById + bust sonrası slug = 3
    expect(repo.findOne).toHaveBeenCalledTimes(3)
  })

  it('bulunamayan slug cache\'lenmez', async () => {
    const { service, repo } = makeService([])
    repo.findOne.mockResolvedValueOnce(null).mockResolvedValue({ id: 'p1', slug: 'yeni' } as Project)
    await expect(service.findBySlug('yeni')).rejects.toThrow('Proje bulunamadı')
    await expect(service.findBySlug('yeni')).resolves.toMatchObject({ slug: 'yeni' })
    expect(repo.findOne).toHaveBeenCalledTimes(2)
  })
})
