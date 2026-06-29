import { InternalServerErrorException } from '@nestjs/common'
import { InstagramImportService } from '../instagram-import.service'

// Mock external dependencies
jest.mock('sharp', () => jest.fn().mockReturnValue({ webp: jest.fn().mockReturnThis(), toFile: jest.fn() }))
jest.mock('fs/promises', () => ({ writeFile: jest.fn() }))
jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({ on: jest.fn() })))

const mockPost = (id: string, caption: string) => ({
  id,
  caption,
  media_type: 'IMAGE',
  media_url: 'https://example.com/image.jpg',
  thumbnail_url: null,
  children: null,
})

function makeService(overrides: {
  existingIds?: string[]
  tokenValue?: string | null
  parseResult?: any
  saveShouldFail?: boolean
} = {}) {
  const existingIds = new Set(overrides.existingIds ?? [])

  const projectRepo = {
    findOne: jest.fn().mockImplementation(({ where }: any) => {
      const id = where?.instagramMediaId
      return Promise.resolve(existingIds.has(id) ? { id: 'existing', instagramMediaId: id } : null)
    }),
    find: jest.fn().mockImplementation(({ where }: any) => {
      const ids: string[] = where?.instagramMediaId?.['_value'] ?? []
      return Promise.resolve(
        ids.filter(id => existingIds.has(id)).map(id => ({ instagramMediaId: id })),
      )
    }),
    create: jest.fn().mockImplementation((data: any) => ({ ...data })),
    save: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb: any) => {
        const manager = {
          create: jest.fn().mockImplementation((_, data: any) => ({ ...data })),
          save: jest.fn().mockImplementation((entity: any) => {
            if (overrides.saveShouldFail) throw Object.assign(new Error('DB error'), { code: '99999' })
            return Promise.resolve({ ...entity, id: 'new-project-id' })
          }),
        }
        return cb(manager)
      }),
    },
  }

  const projectsService = {
    uniqueSlug: jest.fn().mockResolvedValue('test-proje'),
    toSlug: jest.fn().mockReturnValue('test-proje'),
  }

  const mediaService = {
    addMedia: jest.fn().mockResolvedValue({ id: 'media-id' }),
  }

  const parseService = {
    parseInstagram: jest.fn().mockResolvedValue(
      overrides.parseResult ?? {
        name: 'Test Proje',
        location: 'Manisa',
        kw: 10,
        date: '2024',
        description: 'Test açıklama',
        specs: [],
        highlights: [],
        statBoxes: [],
      },
    ),
  }

  const tokenService = {
    getAccessToken: jest.fn().mockResolvedValue(overrides.tokenValue !== undefined ? overrides.tokenValue : 'mock-token'),
  }

  const config = {
    get: jest.fn().mockImplementation((key: string, def?: any) => {
      const vals: Record<string, string> = {
        INSTAGRAM_USER_ID: 'test-user-id',
        INSTAGRAM_HASHTAG: '#proje',
      }
      return vals[key] ?? def ?? 'test-user-id'
    }),
  }

  const service = new InstagramImportService(
    projectRepo as any,
    projectsService as any,
    mediaService as any,
    parseService as any,
    tokenService as any,
    config as any,
  )

  return { service, projectRepo, mediaService, parseService, tokenService }
}

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('InstagramImportService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('syncInstagram — N+1 protection', () => {
    it('should use a single batch query instead of N+1 findOne calls', async () => {
      const posts = [
        mockPost('111', 'Test proje #proje'),
        mockPost('222', 'Başka proje #proje'),
        mockPost('333', 'Üçüncü proje #proje'),
      ]

      const { service, projectRepo } = makeService({ existingIds: ['111'] })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: posts }),
        text: () => Promise.resolve(''),
      })
      // Image download mock
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('fake-image')),
      })

      await service.syncInstagram()

      // Batch find should be called once (not once per post)
      expect(projectRepo.find).toHaveBeenCalledTimes(1)
      // Individual findOne should NOT be called in the sync loop
      expect(projectRepo.findOne).not.toHaveBeenCalled()
    })

    it('should skip already-existing posts without calling parseInstagram', async () => {
      const posts = [mockPost('existing-id', 'Mevcut proje #proje')]
      const { service, parseService } = makeService({ existingIds: ['existing-id'] })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: posts }),
        text: () => Promise.resolve(''),
      })

      const result = await service.syncInstagram()

      expect(result.skipped).toBe(1)
      expect(result.imported).toBe(0)
      expect(parseService.parseInstagram).not.toHaveBeenCalled()
    })
  })

  describe('createProjectFromInstagram — transaction', () => {
    it('should save project inside a DB transaction', async () => {
      const post = mockPost('new-id', 'Yeni proje #proje')
      const { service, projectRepo } = makeService()

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('fake')),
      })

      await (service as any).createProjectFromInstagram(
        { name: 'Test', location: 'İzmir', kw: 5, date: '2024', description: 'desc', specs: [], highlights: [], statBoxes: [] },
        post,
        true,
      )

      expect(projectRepo.manager.transaction).toHaveBeenCalledTimes(1)
    })

    it('should still return existing project on race condition (23505)', async () => {
      const post = mockPost('race-id', 'Race proje #proje')
      const { service, projectRepo } = makeService({ saveShouldFail: true })

      const err = Object.assign(new Error('unique constraint'), { code: '23505' })
      projectRepo.manager.transaction = jest.fn().mockRejectedValue(err)
      projectRepo.findOne = jest.fn().mockResolvedValue({ id: 'existing-race', instagramMediaId: 'race-id' })

      const result = await (service as any).createProjectFromInstagram(
        { name: 'Race', location: 'X', kw: 1, date: '2024', description: 'd', specs: [], highlights: [], statBoxes: [] },
        post,
        true,
      )

      expect(result.instagramMediaId).toBe('race-id')
    })
  })

  describe('syncInstagramByMediaId — missing token', () => {
    it('should throw when access token is missing', async () => {
      const { service } = makeService({ tokenValue: null })

      await expect(service.syncInstagramByMediaId('some-media-id')).rejects.toThrow(
        InternalServerErrorException,
      )
    })
  })
})
