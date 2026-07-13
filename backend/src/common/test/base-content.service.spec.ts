import { ConflictException, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { BlogService } from '../../blog/blog.service'
import { BlogPost } from '../../blog/entities/blog-post.entity'
import { ReferencesService } from '../../references/references.service'
import { Reference } from '../../references/entities/reference.entity'
import { FaqService } from '../../faq/faq.service'
import { Faq } from '../../faq/entities/faq.entity'
import { deleteUploadedFile } from '../../upload/uploaded-files'

jest.mock('../../upload/uploaded-files', () => ({
  deleteUploadedFile: jest.fn().mockResolvedValue(undefined),
}))

const mockDeleteFile = deleteUploadedFile as jest.MockedFunction<typeof deleteUploadedFile>

function makeRepo<T extends object>(existing: Partial<T> | null = null) {
  const managerUpdate = jest.fn().mockResolvedValue({})
  return {
    repo: {
      create: jest.fn().mockImplementation((data: Partial<T>) => ({ ...data })),
      save: jest.fn().mockImplementation(async (entity: T) => entity),
      findOne: jest.fn().mockResolvedValue(existing),
      remove: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockResolvedValue([]),
      manager: {
        transaction: jest.fn(
          async (fn: (m: { update: jest.Mock }) => Promise<void>) =>
            fn({ update: managerUpdate }),
        ),
      },
    } as unknown as jest.Mocked<Repository<T>>,
    managerUpdate,
  }
}

beforeEach(() => mockDeleteFile.mockClear())

describe('BaseContentService (BlogService üzerinden)', () => {
  it('yayınlanan yeni yazıya publishedAt damgalar', async () => {
    const { repo } = makeRepo<BlogPost>()
    const service = new BlogService(repo)
    const saved = await service.create({ title: 'a', published: true })
    expect(saved.publishedAt).toBeInstanceOf(Date)
  })

  it('taslak yazıya publishedAt damgalamaz', async () => {
    const { repo } = makeRepo<BlogPost>()
    const service = new BlogService(repo)
    const saved = await service.create({ title: 'a', published: false })
    expect(saved.publishedAt).toBeUndefined()
  })

  it('taslak ilk kez yayınlanırken publishedAt damgalar', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', published: false, publishedAt: null as unknown as Date })
    const service = new BlogService(repo)
    const saved = await service.update('1', { published: true })
    expect(saved.publishedAt).toBeInstanceOf(Date)
  })

  it('daha önce yayınlanmış yazının publishedAt değerini değiştirmez', async () => {
    const original = new Date('2026-01-01')
    const { repo } = makeRepo<BlogPost>({ id: '1', published: false, publishedAt: original })
    const service = new BlogService(repo)
    const saved = await service.update('1', { published: true })
    expect(saved.publishedAt).toBe(original)
  })

  it('slug çakışmasında (23505) ConflictException fırlatır', async () => {
    const { repo } = makeRepo<BlogPost>()
    ;(repo.save as jest.Mock).mockRejectedValue(Object.assign(new Error('dup'), { code: '23505' }))
    const service = new BlogService(repo)
    await expect(service.create({ title: 'a', slug: 'x' })).rejects.toThrow(ConflictException)
  })

  it('kapak değişince eski dosyayı siler', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', coverImage: '/uploads/eski.webp' })
    const service = new BlogService(repo)
    await service.update('1', { coverImage: '/uploads/yeni.webp' })
    expect(mockDeleteFile).toHaveBeenCalledWith('/uploads/eski.webp')
  })

  it('kapak dto\'da yoksa dosya silinmez', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', coverImage: '/uploads/eski.webp' })
    const service = new BlogService(repo)
    await service.update('1', { title: 'yeni başlık' })
    expect(mockDeleteFile).not.toHaveBeenCalled()
  })

  it('silinen yazının kapak dosyasını da siler', async () => {
    const { repo } = makeRepo<BlogPost>({ id: '1', coverImage: '/uploads/kapak.webp' })
    const service = new BlogService(repo)
    await service.remove('1')
    expect(mockDeleteFile).toHaveBeenCalledWith('/uploads/kapak.webp')
  })

  it('bulunamayan id için NotFoundException fırlatır', async () => {
    const { repo } = makeRepo<BlogPost>(null)
    const service = new BlogService(repo)
    await expect(service.findById('yok')).rejects.toThrow(NotFoundException)
  })

  it('reorder her id\'ye sırasını yazar (tek transaction)', async () => {
    const { repo, managerUpdate } = makeRepo<BlogPost>()
    const service = new BlogService(repo)
    await service.reorder(['b', 'a', 'c'])
    expect(managerUpdate).toHaveBeenCalledWith(BlogPost, 'b', { sortOrder: 0 })
    expect(managerUpdate).toHaveBeenCalledWith(BlogPost, 'a', { sortOrder: 1 })
    expect(managerUpdate).toHaveBeenCalledWith(BlogPost, 'c', { sortOrder: 2 })
  })
})

describe('ReferencesService — logo temizliği', () => {
  it('logo değişince eski dosyayı siler', async () => {
    const { repo } = makeRepo<Reference>({ id: '1', logo: '/uploads/eski-logo.webp' })
    const service = new ReferencesService(repo)
    await service.update('1', { logo: '/uploads/yeni-logo.webp' })
    expect(mockDeleteFile).toHaveBeenCalledWith('/uploads/eski-logo.webp')
  })

  it('silinen referansın logosunu da siler', async () => {
    const { repo } = makeRepo<Reference>({ id: '1', logo: '/uploads/logo.webp' })
    const service = new ReferencesService(repo)
    await service.remove('1')
    expect(mockDeleteFile).toHaveBeenCalledWith('/uploads/logo.webp')
  })
})

describe('FaqService — sıralama farkı', () => {
  it('public liste en eski üstte okunur', async () => {
    const { repo } = makeRepo<Faq>()
    const service = new FaqService(repo)
    await service.findAllPublic()
    expect(repo.find).toHaveBeenCalledWith({
      where: { published: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    })
  })
})
