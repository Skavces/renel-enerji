import type Redis from 'ioredis'
import { ChatHistoryService, HISTORY_MAX_MESSAGES } from '../chat-history.service'
import type { ChatMessage } from '../chat.service'

const SESSION = '3f2b8c1a-9d4e-4f6a-8b2c-1d3e5f7a9b0c'
const KEY = `chat:history:${SESSION}`

function makeService(redisOverrides: Partial<Record<'get' | 'set', jest.Mock>> = {}) {
  const redis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    ...redisOverrides,
  }
  return { service: new ChatHistoryService(redis as unknown as Redis), redis }
}

const msg = (i: number): ChatMessage => ({ role: 'user', content: `mesaj ${i}` })

describe('ChatHistoryService', () => {
  describe('load', () => {
    it('returns the parsed history', async () => {
      const history = [msg(1), { role: 'assistant', content: 'cevap' }]
      const { service } = makeService({ get: jest.fn().mockResolvedValue(JSON.stringify(history)) })
      expect(await service.load(SESSION)).toEqual(history)
    })

    it('returns [] when no history exists', async () => {
      const { service, redis } = makeService()
      expect(await service.load(SESSION)).toEqual([])
      expect(redis.get).toHaveBeenCalledWith(KEY)
    })

    it('fails open with [] when Redis is unreachable', async () => {
      const { service } = makeService({
        get: jest.fn().mockRejectedValue(new Error('connection refused')),
      })
      expect(await service.load(SESSION)).toEqual([])
    })

    it('fails open with [] on corrupted payloads', async () => {
      const broken = makeService({ get: jest.fn().mockResolvedValue('{bozuk json') })
      expect(await broken.service.load(SESSION)).toEqual([])

      const notArray = makeService({ get: jest.fn().mockResolvedValue('{"a":1}') })
      expect(await notArray.service.load(SESSION)).toEqual([])
    })
  })

  describe('save', () => {
    it('stores the messages with a 1 hour TTL', async () => {
      const { service, redis } = makeService()
      const history = [msg(1), msg(2)]

      await service.save(SESSION, history)

      expect(redis.set).toHaveBeenCalledWith(KEY, JSON.stringify(history), 'EX', 3600)
    })

    it('trims the history to the last HISTORY_MAX_MESSAGES entries', async () => {
      const { service, redis } = makeService()
      const long = Array.from({ length: HISTORY_MAX_MESSAGES + 5 }, (_, i) => msg(i))

      await service.save(SESSION, long)

      const stored = JSON.parse(redis.set.mock.calls[0][1]) as ChatMessage[]
      expect(stored).toHaveLength(HISTORY_MAX_MESSAGES)
      expect(stored[0]).toEqual(msg(5))
      expect(stored[stored.length - 1]).toEqual(msg(HISTORY_MAX_MESSAGES + 4))
    })

    it('swallows Redis write errors (fail-open)', async () => {
      const { service } = makeService({ set: jest.fn().mockRejectedValue(new Error('down')) })
      await expect(service.save(SESSION, [msg(1)])).resolves.toBeUndefined()
    })
  })
})
