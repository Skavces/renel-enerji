import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import { Repository } from 'typeorm'
import { AppSetting } from '../app-setting.entity'
import { InstagramTokenService } from '../instagram-token.service'
import { EncryptionService } from '../../common/encryption.service'
import { fetchWithTimeout } from '../../common/fetch-with-timeout'

jest.mock('../../common/fetch-with-timeout')

const mockFetch = fetchWithTimeout as jest.MockedFunction<typeof fetchWithTimeout>

function okResponse(accessToken = 'IGQVJrefreshed', expiresIn = 5184000): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ access_token: accessToken, expires_in: expiresIn }),
  } as unknown as Response
}

function errResponse(status: number, text: string): Response {
  return { ok: false, status, text: async () => text } as unknown as Response
}

const TEST_KEY = 'b'.repeat(64)

function makeEncryption(): EncryptionService {
  const cfg = { get: jest.fn().mockReturnValue(TEST_KEY) } as unknown as ConfigService
  return new EncryptionService(cfg)
}

function makeService(storedValue: string | null, envToken = '') {
  const repo = {
    findOne: jest.fn().mockImplementation(({ where }: { where: { key: string } }) =>
      Promise.resolve(
        where.key === 'instagram_access_token' && storedValue !== null
          ? { key: where.key, value: storedValue }
          : null,
      ),
    ),
    update: jest.fn().mockResolvedValue(undefined),
    upsert: jest.fn().mockResolvedValue(undefined),
  } as unknown as Repository<AppSetting>

  const config = {
    get: jest.fn((key: string) => (key === 'INSTAGRAM_ACCESS_TOKEN' ? envToken : undefined)),
  } as unknown as ConfigService

  const encryption = makeEncryption()
  const service = new InstagramTokenService(repo, config, encryption)
  return { service, repo, encryption }
}

describe('InstagramTokenService.getAccessToken', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should decrypt an encrypted stored token', async () => {
    const encryption = makeEncryption()
    const { service } = makeService(encryption.encrypt('IGQVJtoken123'))

    await expect(service.getAccessToken()).resolves.toBe('IGQVJtoken123')
  })

  it('should migrate a legacy plaintext token to encrypted form on first read', async () => {
    const { service, repo } = makeService('IGQVJplaintext')

    const token = await service.getAccessToken()

    expect(token).toBe('IGQVJplaintext')
    expect(repo.update).toHaveBeenCalledWith('instagram_access_token', {
      value: expect.stringMatching(/^enc:v1:/),
    })
  })

  it('should not rewrite an already-encrypted token', async () => {
    const encryption = makeEncryption()
    const { service, repo } = makeService(encryption.encrypt('IGQVJtoken123'))

    await service.getAccessToken()

    expect(repo.update).not.toHaveBeenCalled()
  })

  it('should fall back to the env token when nothing is stored', async () => {
    const { service } = makeService(null, 'env-token')

    await expect(service.getAccessToken()).resolves.toBe('env-token')
  })
})

describe('InstagramTokenService.refresh', () => {
  const LIVE_TOKEN = 'IGQWLiveTokenAbc123456789'

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  it('should not redact the token in the request URL itself', async () => {
    const encryption = makeEncryption()
    const { service } = makeService(encryption.encrypt(LIVE_TOKEN))
    mockFetch.mockResolvedValue(okResponse())

    await service.refresh()

    const [requestUrl] = mockFetch.mock.calls[0]
    expect(requestUrl).toContain(`access_token=${LIVE_TOKEN}`)
  })

  it('should redact the live token if Meta echoes it back in an error body', async () => {
    const encryption = makeEncryption()
    const { service } = makeService(encryption.encrypt(LIVE_TOKEN))
    mockFetch.mockResolvedValue(
      errResponse(400, `Error validating access token ${LIVE_TOKEN}: Session has expired`),
    )
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    await service.refresh()

    const loggedMessage = errorSpy.mock.calls[0]?.[0]
    expect(loggedMessage).not.toContain(LIVE_TOKEN)
    expect(loggedMessage).toContain('[REDACTED]')
  })

  it('should redact the token from a thrown fetch error message', async () => {
    const encryption = makeEncryption()
    const { service } = makeService(encryption.encrypt(LIVE_TOKEN))
    mockFetch.mockRejectedValue(new Error(`fetch failed for ?access_token=${LIVE_TOKEN}`))
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)

    await service.refresh()

    const loggedMessage = errorSpy.mock.calls[0]?.[0]
    expect(loggedMessage).not.toContain(LIVE_TOKEN)
  })

  it('should store the refreshed token on success', async () => {
    const encryption = makeEncryption()
    const { service, repo } = makeService(encryption.encrypt(LIVE_TOKEN))
    mockFetch.mockResolvedValue(okResponse('IGQVJnewToken'))

    await service.refresh()

    expect(repo.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ key: 'instagram_access_token' })]),
      ['key'],
    )
  })
})
