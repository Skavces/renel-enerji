import { Repository } from 'typeorm'
import { ChatRetentionService } from '../chat-retention.service'
import { ChatRating } from '../entities/chat-rating.entity'
import { ChatLead } from '../entities/chat-lead.entity'

function makeRepo(affected = 0) {
  const qb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected }),
  }
  return { repo: { createQueryBuilder: jest.fn().mockReturnValue(qb) }, qb }
}

describe('ChatRetentionService', () => {
  it('6 aydan eski dökümleri her iki tabloda da null yapar', async () => {
    const ratings = makeRepo(3)
    const leads = makeRepo(5)
    const service = new ChatRetentionService(
      ratings.repo as unknown as Repository<ChatRating>,
      leads.repo as unknown as Repository<ChatLead>,
    )

    await service.purgeOldTranscripts()

    for (const { qb } of [ratings, leads]) {
      expect(qb.set).toHaveBeenCalledWith({ conversation: null })
      expect(qb.where).toHaveBeenCalledWith(expect.stringContaining("interval '6 months'"))
      expect(qb.andWhere).toHaveBeenCalledWith('conversation IS NOT NULL')
      expect(qb.execute).toHaveBeenCalledTimes(1)
    }
  })

  it('veritabanı hatası cron\'u patlatmaz', async () => {
    const ratings = makeRepo()
    ratings.qb.execute.mockRejectedValue(new Error('db down'))
    const leads = makeRepo()
    const service = new ChatRetentionService(
      ratings.repo as unknown as Repository<ChatRating>,
      leads.repo as unknown as Repository<ChatLead>,
    )
    await expect(service.purgeOldTranscripts()).resolves.toBeUndefined()
  })
})
