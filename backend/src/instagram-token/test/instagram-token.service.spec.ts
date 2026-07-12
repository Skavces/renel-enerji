import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import { AppSetting } from '../app-setting.entity'
import { InstagramTokenService } from '../instagram-token.service'
import { EncryptionService } from '../../common/encryption.service'

const TEST_KEY = 'b'.repeat(64)

function makeEncryption(): EncryptionService {
  const cfg = { get: jest.fn().mockReturnValue(TEST_KEY) } as unknown as ConfigService
  return new EncryptionService(cfg)
}

function makeService(storedValue: string | null, envToken = '') {
  const repo = {
    findOne: jest.fn().mockImplementation(({ where }: any) =>
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
