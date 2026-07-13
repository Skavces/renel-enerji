import { ConflictException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { ChatRatingService } from '../chat-rating.service'
import { ChatRating } from '../entities/chat-rating.entity'

const SESSION = '3f2b8c1a-9d4e-4f6a-8b2c-1d3e5f7a9b0c'

function makeService() {
  const repo = {
    create: jest.fn().mockImplementation((data: Partial<ChatRating>) => data as ChatRating),
    save: jest.fn().mockImplementation(async (rating: ChatRating) => rating),
    findOne: jest.fn().mockResolvedValue(null),
    remove: jest.fn(),
  } as unknown as jest.Mocked<Repository<ChatRating>>
  return { service: new ChatRatingService(repo), repo }
}

describe('ChatRatingService.create', () => {
  it('sessionId ile kaydeder', async () => {
    const { service, repo } = makeService()
    await service.create(5, [{ role: 'user', content: 'süper' }], SESSION)

    const created = (repo.create as jest.Mock).mock.calls[0][0]
    expect(created.sessionId).toBe(SESSION)
    expect(created.rating).toBe(5)
  })

  it('sessionId yoksa null kaydeder (anonim istemciler engellenmez)', async () => {
    const { service, repo } = makeService()
    await service.create(4, [])

    const created = (repo.create as jest.Mock).mock.calls[0][0]
    expect(created.sessionId).toBeNull()
  })

  it('aynı sessionId ikinci kez puan gönderince 409 döner', async () => {
    const { service, repo } = makeService()
    repo.save.mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }))

    await expect(service.create(1, [], SESSION)).rejects.toThrow(ConflictException)
  })

  it('diğer DB hatalarını olduğu gibi fırlatır', async () => {
    const { service, repo } = makeService()
    repo.save.mockRejectedValueOnce(new Error('connection lost'))

    await expect(service.create(3, [], SESSION)).rejects.toThrow('connection lost')
  })
})
