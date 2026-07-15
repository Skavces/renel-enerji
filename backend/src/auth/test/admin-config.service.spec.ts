import { ConfigService } from '@nestjs/config'
import { Repository } from 'typeorm'
import { AdminConfig } from '../admin-config.entity'
import { AdminConfigService } from '../admin-config.service'
import { EncryptionService } from '../../common/encryption.service'

const TEST_KEY = 'a'.repeat(64) // 64 karakter hex

function makeEncryption(): EncryptionService {
  const cfg = { get: jest.fn().mockReturnValue(TEST_KEY) } as unknown as ConfigService
  return new EncryptionService(cfg)
}

function makeService(row: Partial<AdminConfig>) {
  const insertChain = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  }

  const repo = {
    createQueryBuilder: jest.fn().mockReturnValue(insertChain),
    findOne: jest.fn().mockResolvedValue({ id: 1, username: null, passwordHash: null, totpSecret: null, tokenVersion: 0, ...row }),
    update: jest.fn().mockResolvedValue(undefined),
    upsert: jest.fn().mockResolvedValue(undefined),
    increment: jest.fn().mockResolvedValue(undefined),
  } as unknown as Repository<AdminConfig>

  const encryption = makeEncryption()
  const service = new AdminConfigService(repo, encryption)
  return { service, repo, encryption, insertChain }
}

describe('AdminConfigService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getConfig', () => {
    // Regresyon kilidi: upsert({ totpSecret: null }) her çağrıda kayıtlı secret'ı
    // NULL'a eziyordu (TypeORM'da null !== undefined → overwrite kolonuna girer).
    // Satır garantisi yalnızca INSERT ... ON CONFLICT DO NOTHING ile sağlanmalı
    // ve boot'ta (onModuleInit) çalışmalı — istek yolunda değil.
    it('must NOT touch existing columns while ensuring the row exists at boot', async () => {
      const encryption = makeEncryption()
      const { service, repo, insertChain } = makeService({
        totpSecret: encryption.encrypt('SECRET123'),
      })

      await service.onModuleInit()
      await service.getConfig()

      expect(repo.upsert).not.toHaveBeenCalled()
      expect(insertChain.values).toHaveBeenCalledWith({ id: 1 })
      expect(insertChain.orIgnore).toHaveBeenCalled()
    })

    it('does not run the ensure-row insert on the request path when the row exists', async () => {
      const { service, repo, insertChain } = makeService({})

      await service.getConfig()

      expect(insertChain.execute).not.toHaveBeenCalled()
      expect(repo.findOne).toHaveBeenCalledTimes(1)
    })

    it('recreates the row as a safety net when it is missing', async () => {
      const { service, repo, insertChain } = makeService({})
      ;(repo.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1, username: null, passwordHash: null, totpSecret: null, tokenVersion: 0 })

      const config = await service.getConfig()

      expect(insertChain.execute).toHaveBeenCalledTimes(1)
      expect(config.id).toBe(1)
    })

    it('should return the decrypted TOTP secret and keep it stored', async () => {
      const encryption = makeEncryption()
      const stored = encryption.encrypt('SECRET123')
      const { service, repo } = makeService({ totpSecret: stored })

      const config = await service.getConfig()

      expect(config.totpSecret).toBe('SECRET123')
      // Şifreli kayıt tekrar yazılmaz (yalnızca legacy düz metin migrate edilir)
      expect(repo.update).not.toHaveBeenCalled()
    })

    it('should migrate a legacy plaintext secret to encrypted form on first read', async () => {
      const { service, repo } = makeService({ totpSecret: 'PLAINTEXT' })

      await service.getConfig()

      expect(repo.update).toHaveBeenCalledWith(1, {
        totpSecret: expect.stringMatching(/^enc:v1:/),
      })
    })

    it('should survive repeated calls without wiping the secret (simulated persistence)', async () => {
      const encryption = makeEncryption()
      const stored = encryption.encrypt('SECRET123')
      const { service } = makeService({ totpSecret: stored })

      const first = await service.getConfig()
      const second = await service.getConfig()

      expect(first.totpSecret).toBe('SECRET123')
      expect(second.totpSecret).toBe('SECRET123')
    })
  })

  describe('getConfig — in-memory cache', () => {
    it('serves repeated calls within the TTL from cache without hitting the DB', async () => {
      const { service, repo } = makeService({})

      await service.getConfig()
      await service.getConfig()
      await service.getConfig()

      expect(repo.findOne).toHaveBeenCalledTimes(1)
    })

    it('invalidates the cache when credentials change', async () => {
      const { service, repo } = makeService({})

      await service.getConfig()
      await service.setPasswordHash('new-hash')
      await service.getConfig()

      expect(repo.findOne).toHaveBeenCalledTimes(2)
    })

    it('invalidates the cache when tokenVersion is incremented', async () => {
      const { service, repo } = makeService({ tokenVersion: 3 })

      await service.getConfig()
      ;(repo.findOne as jest.Mock).mockResolvedValue({ id: 1, username: null, passwordHash: null, totpSecret: null, tokenVersion: 4 })
      await service.incrementTokenVersion()
      const config = await service.getConfig()

      // Eski token'ların anında geçersizleşmesi cache'in düşmesine bağlı
      expect(config.tokenVersion).toBe(4)
      expect(repo.findOne).toHaveBeenCalledTimes(2)
    })

    it('invalidates the cache on TOTP secret changes', async () => {
      const { service, repo } = makeService({})

      await service.getConfig()
      await service.setTotpSecret('NEWSECRET')
      await service.getConfig()
      await service.removeTotpSecret()
      await service.getConfig()
      await service.setUsername('newadmin')
      await service.getConfig()

      expect(repo.findOne).toHaveBeenCalledTimes(4)
    })
  })

  describe('incrementTokenVersion', () => {
    it('should increment the tokenVersion column by 1', async () => {
      const { service, repo } = makeService({})

      await service.incrementTokenVersion()

      expect(repo.increment).toHaveBeenCalledWith({ id: 1 }, 'tokenVersion', 1)
    })
  })
})
