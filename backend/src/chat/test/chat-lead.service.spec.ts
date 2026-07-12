import { Repository } from 'typeorm'
import { ChatLeadService } from '../chat-lead.service'
import { ChatLead } from '../entities/chat-lead.entity'

const SESSION = '3f2b8c1a-9d4e-4f6a-8b2c-1d3e5f7a9b0c'

function makeService() {
  const repo = {
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockImplementation(async (lead: ChatLead) => lead),
    create: jest.fn().mockImplementation((data: Partial<ChatLead>) => data as ChatLead),
    update: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<Repository<ChatLead>>
  return { service: new ChatLeadService(repo), repo }
}

describe('ChatLeadService', () => {
  describe('upsertFromChat', () => {
    it('sessionId yoksa hiçbir şey yapmaz', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(undefined, [{ role: 'user', content: 'a' }, { role: 'user', content: 'b' }], 'cevap')
      expect(repo.save).not.toHaveBeenCalled()
    })

    it('tek kullanıcı mesajında lead oluşturmaz', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(SESSION, [{ role: 'user', content: 'merhaba' }], 'cevap')
      expect(repo.save).not.toHaveBeenCalled()
    })

    it('iki kullanıcı mesajında lead oluşturur, bot cevabını da dahil eder', async () => {
      const { service, repo } = makeService()
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'çatı ges' },
          { role: 'assistant', content: 'fatura?' },
          { role: 'user', content: '2500' },
        ],
        'şebeke bağlantısı?',
      )
      expect(repo.save).toHaveBeenCalledTimes(1)
      const saved = (repo.save as jest.Mock).mock.calls[0][0]
      expect(saved.sessionId).toBe(SESSION)
      expect(saved.messageCount).toBe(2)
      expect(saved.conversation).toHaveLength(4)
      expect(saved.conversation[3]).toEqual({ role: 'assistant', content: 'şebeke bağlantısı?' })
    })

    it('mevcut lead varsa yenisini açmaz, konuşmayı günceller', async () => {
      const { service, repo } = makeService()
      const existing = { sessionId: SESSION, conversation: [], messageCount: 2 } as unknown as ChatLead
      ;(repo.findOne as jest.Mock).mockResolvedValue(existing)
      await service.upsertFromChat(
        SESSION,
        [
          { role: 'user', content: 'a' },
          { role: 'assistant', content: 'b' },
          { role: 'user', content: 'c' },
          { role: 'assistant', content: 'd' },
          { role: 'user', content: 'e' },
        ],
        'cevap',
      )
      expect(repo.create).not.toHaveBeenCalled()
      expect(existing.messageCount).toBe(3)
      expect(existing.conversation).toHaveLength(6)
    })
  })

  describe('markWhatsapp / attachRating', () => {
    it('sessionId ile durumu whatsapp yapar', async () => {
      const { service, repo } = makeService()
      await service.markWhatsapp(SESSION)
      expect(repo.update).toHaveBeenCalledWith({ sessionId: SESSION }, { status: 'whatsapp' })
    })

    it('sessionId yoksa update çağrılmaz', async () => {
      const { service, repo } = makeService()
      await service.markWhatsapp(undefined)
      await service.attachRating(undefined, 5)
      expect(repo.update).not.toHaveBeenCalled()
    })

    it('puanı lead\'e işler', async () => {
      const { service, repo } = makeService()
      await service.attachRating(SESSION, 3)
      expect(repo.update).toHaveBeenCalledWith({ sessionId: SESSION }, { rating: 3 })
    })
  })
})
