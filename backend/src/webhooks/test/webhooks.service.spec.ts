import { ConfigService } from '@nestjs/config'
import { WebhooksService } from '../webhooks.service'
import { InstagramImportService } from '../../projects/instagram-import.service'

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

    service.handleInstagramEvent(feedEvent('bozuk', 'saglam'))
    await flush()
    expect(syncInstagramByMediaId).toHaveBeenCalledTimes(2)
    expect(syncInstagramByMediaId).toHaveBeenLastCalledWith('saglam')
  })
})
