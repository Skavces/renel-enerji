import { ConfigService } from '@nestjs/config'
import { WebhooksService } from '../webhooks.service'
import { InstagramImportService } from '../../projects/instagram-import.service'
import type { InstagramWebhookBody } from '../../projects/instagram-types'

function makeService() {
  const config = { get: jest.fn() } as unknown as ConfigService
  const syncInstagramByMediaId = jest.fn().mockResolvedValue(undefined)
  const importService = { syncInstagramByMediaId } as unknown as InstagramImportService
  return { service: new WebhooksService(config, importService), syncInstagramByMediaId }
}

function feedEvent(...mediaIds: string[]) {
  return {
    object: 'instagram',
    entry: [
      {
        changes: mediaIds.map(id => ({ field: 'feed', value: { verb: 'add', media: { id } } })),
      },
    ],
  }
}

// Un-awaited promise zincirinin koşması için event loop'a sıra ver
const flush = () => new Promise(resolve => setImmediate(resolve))

describe('WebhooksService.handleInstagramEvent', () => {
  it('returns immediately and runs the sync in the background', async () => {
    const { service, syncInstagramByMediaId } = makeService()
    let resolveSync!: () => void
    syncInstagramByMediaId.mockReturnValueOnce(new Promise<void>(r => (resolveSync = r)))

    // Senkron döner: ağır iş isteği bekletmez
    expect(service.handleInstagramEvent(feedEvent('42'))).toBeUndefined()
    expect(syncInstagramByMediaId).toHaveBeenCalledWith('42')
    resolveSync()
    await flush()
  })

  it('processes every media id in the event', async () => {
    const { service, syncInstagramByMediaId } = makeService()
    service.handleInstagramEvent(feedEvent('1', '2', '3'))
    await flush()
    expect(syncInstagramByMediaId.mock.calls.map(c => c[0])).toEqual(['1', '2', '3'])
  })

  it('ignores non-instagram objects, non-feed fields and non-add verbs', async () => {
    const { service, syncInstagramByMediaId } = makeService()
    service.handleInstagramEvent({ object: 'page' })
    service.handleInstagramEvent({
      object: 'instagram',
      entry: [
        { changes: [{ field: 'comments', value: { verb: 'add', media: { id: 'x' } } }] },
        { changes: [{ field: 'feed', value: { verb: 'remove', media: { id: 'y' } } }] },
        { changes: [{ field: 'feed', value: { verb: 'add' } }] },
      ],
    })
    await flush()
    expect(syncInstagramByMediaId).not.toHaveBeenCalled()
  })

  it('keeps processing later ids when one sync fails', async () => {
    const { service, syncInstagramByMediaId } = makeService()
    syncInstagramByMediaId.mockRejectedValueOnce(new Error('graph api down'))

    service.handleInstagramEvent(feedEvent('111', '222'))
    await flush()
    expect(syncInstagramByMediaId).toHaveBeenCalledTimes(2)
    expect(syncInstagramByMediaId).toHaveBeenLastCalledWith('222')
  })

  it('skips a non-numeric media id but keeps processing the rest', async () => {
    const { service, syncInstagramByMediaId } = makeService()

    service.handleInstagramEvent(feedEvent('abc123', '42'))
    await flush()

    expect(syncInstagramByMediaId).toHaveBeenCalledTimes(1)
    expect(syncInstagramByMediaId).toHaveBeenCalledWith('42')
  })

  it('processes normally when the payload has extra known fields (entry id/time)', async () => {
    const { service, syncInstagramByMediaId } = makeService()

    // entry.id/entry.time gerçek Meta payload'ında hep var ama InstagramWebhookBody
    // arayüzü kasıtlı olarak yalnızca kullanılan alanları modelliyor (instagram-types.ts) —
    // cast burada o kasıtlı daralmayı test amaçlı aşmak için.
    const withExtraFields = {
      object: 'instagram',
      entry: [
        {
          id: '17841400008460056',
          time: 1520383571,
          changes: [{ field: 'feed', value: { verb: 'add', media: { id: '42' } } }],
        },
      ],
    } as unknown as InstagramWebhookBody

    service.handleInstagramEvent(withExtraFields)
    await flush()

    expect(syncInstagramByMediaId).toHaveBeenCalledWith('42')
  })

  it('does not throw and skips the entry when a nested field has the wrong shape', async () => {
    const { service, syncInstagramByMediaId } = makeService()

    const malformed = {
      object: 'instagram',
      entry: [{ changes: [{ field: 'feed', value: 'weird string' }] }],
    } as unknown as InstagramWebhookBody

    expect(() => service.handleInstagramEvent(malformed)).not.toThrow()
    await flush()

    expect(syncInstagramByMediaId).not.toHaveBeenCalled()
  })
})
