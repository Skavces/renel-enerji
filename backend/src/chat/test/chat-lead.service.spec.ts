import { Repository } from 'typeorm'
import { ChatLeadService } from '../chat-lead.service'
import { ChatLead } from '../entities/chat-lead.entity'
import { NtfyService } from '../../notifications/ntfy.service'

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
  const ntfy = { send: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<NtfyService>
  return { service: new ChatLeadService(repo, ntfy), repo, ntfy }
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

  describe('notifyMissedLeads', () => {
    it('kaçan lead için ntfy mesajı atar ve notifiedAt doldurur', async () => {
      const { service, repo, ntfy } = makeService()
      const lead = {
        sessionId: SESSION,
        status: 'active',
        messageCount: 3,
        conversation: [
          { role: 'user', content: 'çatı ges istiyorum' },
          { role: 'assistant', content: 'fatura?' },
          { role: 'user', content: '2500 TL' },
        ],
        notifiedAt: null,
        createdAt: new Date('2026-07-05T10:00:00Z'),
      } as unknown as ChatLead
      ;(repo.find as jest.Mock).mockResolvedValue([lead])

      await service.notifyMissedLeads()

      expect(ntfy.send).toHaveBeenCalledTimes(1)
      const text = (ntfy.send as jest.Mock).mock.calls[0][0]
      expect(text).toContain('potansiyel talep')
      expect(text).toContain('çatı ges istiyorum')
      expect(text).toContain('2500 TL')
      expect(text).not.toContain('fatura?')
      expect(lead.notifiedAt).toBeInstanceOf(Date)
      expect(repo.save).toHaveBeenCalledWith(lead)
    })

    it('cron sorguda yalnızca bildirilmemiş aktif leadleri arar', async () => {
      const { service, repo } = makeService()
      await service.notifyMissedLeads()
      const where = (repo.find as jest.Mock).mock.calls[0][0].where
      expect(where.status).toBe('active')
      expect(where.notifiedAt).toBeDefined()
      expect(where.updatedAt).toBeDefined()
    })

    it('ntfy hatası cron\'u patlatmaz', async () => {
      const { service, repo, ntfy } = makeService()
      ;(repo.find as jest.Mock).mockResolvedValue([
        { conversation: [], messageCount: 2, createdAt: new Date(), notifiedAt: null } as unknown as ChatLead,
      ])
      ;(ntfy.send as jest.Mock).mockRejectedValue(new Error('ntfy down'))
      await expect(service.notifyMissedLeads()).resolves.toBeUndefined()
    })
  })
})
