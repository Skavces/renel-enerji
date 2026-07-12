import { Repository } from 'typeorm'
import { LogsService } from '../logs.service'
import { AppLog } from '../entities/app-log.entity'

function makeService() {
  const execute = jest.fn().mockResolvedValue({ affected: 0 })
  const qb = {
    delete: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute,
  }
  const repo = {
    insert: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  } as unknown as jest.Mocked<Repository<AppLog>>
  return { service: new LogsService(repo), repo, qb, execute }
}

describe('LogsService', () => {
  describe('record', () => {
    it('log kaydını level, context ve mesajla insert eder', async () => {
      const { service, repo } = makeService()
      await service.record('error', 'bir şeyler patladı', 'ChatService')
      expect(repo.insert).toHaveBeenCalledWith({
        level: 'error',
        context: 'ChatService',
        message: 'bir şeyler patladı',
      })
    })

    it('context yoksa null yazar', async () => {
      const { service, repo } = makeService()
      await service.record('warn', 'uyarı')
      expect((repo.insert as jest.Mock).mock.calls[0][0].context).toBeNull()
    })

    it('4000 karakterden uzun mesajı kırpar', async () => {
      const { service, repo } = makeService()
      await service.record('error', 'a'.repeat(5000))
      expect((repo.insert as jest.Mock).mock.calls[0][0].message).toHaveLength(4000)
    })

    it('insert hatası yutulur, fırlatılmaz', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      const { service, repo } = makeService()
      ;(repo.insert as jest.Mock).mockRejectedValue(new Error('db down'))
      await expect(service.record('error', 'x')).resolves.toBeUndefined()
    })
  })

  describe('findAllWithStats', () => {
    it('son 200 kaydı tarihe göre ve istatistiklerle döner', async () => {
      const { service, repo } = makeService()
      ;(repo.count as jest.Mock)
        .mockResolvedValueOnce(42)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(7)
      const result = await service.findAllWithStats()
      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        take: 200,
      })
      expect(result.stats).toEqual({ total: 42, errors24h: 3, warns24h: 7 })
    })

    it('level verilirse where filtresi uygular', async () => {
      const { service, repo } = makeService()
      await service.findAllWithStats('error')
      expect((repo.find as jest.Mock).mock.calls[0][0].where).toEqual({ level: 'error' })
    })
  })

  describe('purgeOldLogs', () => {
    it('30 günden eski kayıtları siler', async () => {
      const { service, qb, execute } = makeService()
      execute.mockResolvedValue({ affected: 12 })
      await service.purgeOldLogs()
      expect(qb.delete).toHaveBeenCalled()
      expect((qb.where as jest.Mock).mock.calls[0][0]).toContain("30 days")
    })

    it('silme hatası cron\'u patlatmaz', async () => {
      const { service, execute } = makeService()
      execute.mockRejectedValue(new Error('db down'))
      await expect(service.purgeOldLogs()).resolves.toBeUndefined()
    })
  })
})
