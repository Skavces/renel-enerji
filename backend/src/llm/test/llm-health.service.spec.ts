import { Logger } from '@nestjs/common'
import { LlmHealthService } from '../llm-health.service'
import { LlmService } from '../llm.service'

// checkModelsAvailable() iki ping()'i Promise.all ile eş zamanlı başlatır ama
// dizi elemanları soldan sağa senkron çağrılır, bu yüzden bir kuyruk çağrı
// sırasına göre güvenle eşlenir. NOT: LLM_MODEL === LLM_FALLBACK_MODEL
// (ikisi de minimax-m3:free) olduğundan model adına göre ayırt etmek yerine
// çağrı sırasına göre (1. = ana, 2. = yedek) sonuç veriyoruz.
function makeService(results: [boolean, boolean], keys: string[] = ['key1']): {
  service: LlmHealthService
  ping: jest.Mock
} {
  const queue = [...results]
  const ping = jest.fn(() => Promise.resolve(queue.shift() ?? false))
  const llm = { getKeys: jest.fn().mockReturnValue(keys), ping }
  return { service: new LlmHealthService(llm as unknown as LlmService), ping }
}

describe('LlmHealthService', () => {
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  it('logs nothing when both models respond', async () => {
    const { service, ping } = makeService([true, true])
    await service.checkModelsAvailable()
    expect(ping).toHaveBeenCalledTimes(2)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('logs an error naming the primary-model failure branch when only it fails', async () => {
    const { service } = makeService([false, true])
    await service.checkModelsAvailable()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toContain('ana model')
    expect(errorSpy.mock.calls[0][0]).toContain('yedek modele')
  })

  it('logs an error naming the fallback-model failure branch when only it fails', async () => {
    const { service } = makeService([true, false])
    await service.checkModelsAvailable()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toContain('dil')
    expect(errorSpy.mock.calls[0][0]).toContain('denetçisi')
  })

  it('logs a single combined error when both models fail', async () => {
    const { service } = makeService([false, false])
    await service.checkModelsAvailable()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toContain('hem ana model')
    expect(errorSpy.mock.calls[0][0]).toContain('hem yedek model')
  })

  it('logs an error and skips pinging when no LLM key is configured', async () => {
    const { service, ping } = makeService([true, true], [])
    await service.checkModelsAvailable()
    expect(ping).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })
})
