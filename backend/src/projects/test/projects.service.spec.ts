import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { MAX_FEATURED, ProjectsService } from '../projects.service'
import { Project } from '../entities/project.entity'
import { MediaType, ProjectMedia } from '../entities/project-media.entity'
import { MediaService } from '../media.service'
import { PublicCacheService } from '../../common/public-cache.service'
import { InstagramSkippedMedia } from '../entities/instagram-skipped-media.entity'

const makeSkippedRepo = () =>
  ({ save: jest.fn().mockResolvedValue(undefined) }) as unknown as jest.Mocked<Repository<InstagramSkippedMedia>>

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
  return { service: new ProjectsService(repo, mediaService, new PublicCacheService(), makeSkippedRepo()), repo }
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
  return new ProjectsService(repo, {} as MediaService, new PublicCacheService(), makeSkippedRepo())
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

// Regresyon: findBySlug'da published filtresi yoktu ve taslak projeler slug
// URL'inden okunabiliyordu. Mevcut cache testleri where argümanını hiç
// doğrulamadığı için bug'ı yakalayamamışlardı — burada argüman explicit denetlenir.
describe('ProjectsService.findBySlug — published filtresi', () => {
  it('repo\'dan yalnızca yayınlanmış projeyi ister', async () => {
    const { service, repo } = makeService([])
    repo.findOne.mockResolvedValue({ id: 'p1', slug: 'ges' } as Project)
    await service.findBySlug('ges')
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { slug: 'ges', published: true },
      relations: { media: true },
    })
  })

  it('taslak proje bulunamadı sayılır (404)', async () => {
    const { service, repo } = makeService([])
    repo.findOne.mockResolvedValue(null)
    await expect(service.findBySlug('taslak')).rejects.toThrow(NotFoundException)
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

describe('ProjectsService — öne çıkan projeler', () => {
  function makeFeaturedService(featuredCount: number, current?: Partial<Project>) {
    const repo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(featuredCount),
      findOne: jest.fn().mockImplementation((opts: { where: { id?: string } }) =>
        Promise.resolve(opts.where.id ? current : { featuredOrder: featuredCount - 1 }),
      ),
      create: jest.fn().mockImplementation((dto: Partial<Project>) => ({ ...dto })),
      save: jest.fn().mockImplementation((entity: Partial<Project>) => Promise.resolve(entity)),
    } as unknown as jest.Mocked<Repository<Project>>
    return { service: new ProjectsService(repo, {} as MediaService, new PublicCacheService(), makeSkippedRepo()), repo }
  }

  it('findFeaturedPublic yalnızca yayınlanmış + öne çıkan projeleri, limitli ve sıralı ister', async () => {
    const { service, repo } = makeFeaturedService(0)
    await service.findFeaturedPublic()
    expect(repo.find).toHaveBeenCalledWith({
      where: { published: true, featured: true },
      relations: { media: true },
      order: { featuredOrder: 'ASC', createdAt: 'DESC' },
      take: MAX_FEATURED,
    })
  })

  it('limit doluyken yeni projeyi öne çıkarmak reddedilir', async () => {
    const { service } = makeFeaturedService(MAX_FEATURED, { id: 'p1', featured: false })
    await expect(service.update('p1', { featured: true })).rejects.toThrow(BadRequestException)
  })

  it('zaten öne çıkan projeyi güncellemek limite takılmaz', async () => {
    const { service, repo } = makeFeaturedService(MAX_FEATURED, { id: 'p1', featured: true, featuredOrder: 2 })
    await service.update('p1', { featured: true, name: 'Yeni ad' })
    expect(repo.count).not.toHaveBeenCalled()
  })

  it('yeni öne çıkana listenin sonundaki sıra verilir', async () => {
    const { service } = makeFeaturedService(3, { id: 'p1', featured: false })
    const saved = await service.update('p1', { featured: true })
    expect(saved.featuredOrder).toBe(3)
  })
})

describe('ProjectsService.remove — Instagram projesi', () => {
  function makeRemoveService(project: Partial<Project> | null) {
    const repo = {
      findOne: jest.fn().mockResolvedValue(project),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Repository<Project>>
    const mediaService = { deleteFileIfUnreferenced: jest.fn() } as unknown as MediaService
    const skippedRepo = makeSkippedRepo()
    return { service: new ProjectsService(repo, mediaService, new PublicCacheService(), skippedRepo), skippedRepo }
  }

  it('Instagram kaynaklı projeyi silerken medya ID\'sini deleted olarak işaretler', async () => {
    const { service, skippedRepo } = makeRemoveService({ id: 'p1', instagramMediaId: 'ig-1', media: [] })

    await service.remove('p1')

    expect(skippedRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: 'ig-1', reason: 'deleted' }),
    )
  })

  it('Instagram kaynaklı olmayan projede skip kaydı yazmaz', async () => {
    const { service, skippedRepo } = makeRemoveService({ id: 'p2', instagramMediaId: null as unknown as string, media: [] })

    await service.remove('p2')

    expect(skippedRepo.save).not.toHaveBeenCalled()
  })
})

describe('ProjectsService — seçilebilir kapak (coverMediaId)', () => {
  const img = (id: string, sortOrder: number): ProjectMedia =>
    ({ id, type: MediaType.IMAGE, src: `/uploads/${id}.webp`, sortOrder }) as ProjectMedia
  const vid = (id: string, sortOrder: number): ProjectMedia =>
    ({ id, type: MediaType.VIDEO, src: `/uploads/${id}.mp4`, sortOrder }) as ProjectMedia
  const thumb = (id: string): ProjectMedia =>
    ({ id, type: MediaType.THUMBNAIL, src: `/uploads/${id}.webp`, sortOrder: 9 }) as ProjectMedia

  async function coverOf(project: Partial<Project>): Promise<string[]> {
    const { service } = makeService([{ id: 'p1', ...project }])
    const [p] = await service.findAllPublic()
    return p.media.map(m => m.id)
  }

  it('seçili görsel kapak olur', async () => {
    expect(await coverOf({ coverMediaId: 'i2', media: [img('i1', 0), img('i2', 1)] })).toEqual(['i2'])
  })

  it('seçili video [video, thumbnail poster] olarak döner', async () => {
    expect(
      await coverOf({ coverMediaId: 'v1', media: [img('i1', 0), vid('v1', 1), thumb('t1')] }),
    ).toEqual(['v1', 't1'])
  })

  it('thumbnail yoksa video posteri ilk görsel olur', async () => {
    expect(await coverOf({ coverMediaId: 'v1', media: [vid('v1', 0), img('i2', 2), img('i1', 1)] })).toEqual([
      'v1',
      'i1',
    ])
  })

  it('görsel hiç yoksa yalnızca video döner', async () => {
    expect(await coverOf({ coverMediaId: 'v1', media: [vid('v1', 0)] })).toEqual(['v1'])
  })

  it('geçersiz (silinmiş / başka projenin) kapak otomatik seçime döner', async () => {
    expect(await coverOf({ coverMediaId: 'gone', media: [img('i1', 0), thumb('t1')] })).toEqual(['t1'])
  })

  it('kapak seçilmemişse davranış değişmez: thumbnail > ilk görsel', async () => {
    expect(await coverOf({ coverMediaId: null, media: [img('i1', 0), vid('v1', 1)] })).toEqual(['i1'])
  })

  describe('update — kapak doğrulaması', () => {
    function makeUpdateService(found: Partial<ProjectMedia> | null) {
      const repo = {
        findOne: jest.fn().mockResolvedValue({ id: 'p1', featured: false }),
        save: jest.fn().mockImplementation((e: Partial<Project>) => Promise.resolve(e)),
      } as unknown as jest.Mocked<Repository<Project>>
      const mediaService = {
        findProjectMedia: jest.fn().mockResolvedValue(found),
      } as unknown as jest.Mocked<MediaService>
      return {
        service: new ProjectsService(repo, mediaService, new PublicCacheService(), makeSkippedRepo()),
        mediaService,
      }
    }

    it('başka projenin ya da olmayan medyası reddedilir', async () => {
      const { service, mediaService } = makeUpdateService(null)
      await expect(service.update('p1', { coverMediaId: 'x' })).rejects.toThrow(BadRequestException)
      expect(mediaService.findProjectMedia).toHaveBeenCalledWith('p1', 'x')
    })

    it('thumbnail kapak seçilemez', async () => {
      const { service } = makeUpdateService({ id: 't1', type: MediaType.THUMBNAIL })
      await expect(service.update('p1', { coverMediaId: 't1' })).rejects.toThrow(BadRequestException)
    })

    it('video kapak olarak kabul edilir', async () => {
      const { service } = makeUpdateService({ id: 'v1', type: MediaType.VIDEO })
      const saved = await service.update('p1', { coverMediaId: 'v1' })
      expect(saved.coverMediaId).toBe('v1')
    })

    it('null seçimi temizler ve medya sorgulanmaz', async () => {
      const { service, mediaService } = makeUpdateService(null)
      const saved = await service.update('p1', { coverMediaId: null })
      expect(saved.coverMediaId).toBeNull()
      expect(mediaService.findProjectMedia).not.toHaveBeenCalled()
    })
  })
})
