import { DbLogger } from '../db-logger.service'
import { LogsService } from '../logs.service'

function makeLogger() {
  const logs = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<LogsService>
  return { logger: new DbLogger(logs), logs }
}

describe('DbLogger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => jest.restoreAllMocks())

  it('error çağrısını context ile birlikte kaydeder', () => {
    const { logger, logs } = makeLogger()
    logger.error('bir şeyler patladı', 'ChatService')
    expect(logs.record).toHaveBeenCalledWith('error', 'bir şeyler patladı', 'ChatService')
  })

  it('warn çağrısını da kaydeder', () => {
    const { logger, logs } = makeLogger()
    logger.warn('dil sızıntısı', 'ChatService')
    expect(logs.record).toHaveBeenCalledWith('warn', 'dil sızıntısı', 'ChatService')
  })

  it('çok satırlı son parametreyi (stack trace) context saymaz', () => {
    const { logger, logs } = makeLogger()
    logger.error('patladı', 'Error: x\n    at foo()')
    expect(logs.record).toHaveBeenCalledWith('error', 'patladı', undefined)
  })

  it('string olmayan mesajı JSON\'a çevirir', () => {
    const { logger, logs } = makeLogger()
    logger.error({ code: 42 }, 'ChatService')
    expect(logs.record).toHaveBeenCalledWith('error', '{"code":42}', 'ChatService')
  })
})
