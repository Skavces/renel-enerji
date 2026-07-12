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
    // Satır garantisi yalnızca INSERT ... ON CONFLICT DO NOTHING ile sağlanmalı.
    it('must NOT touch existing columns while ensuring the row exists', async () => {
      const encryption = makeEncryption()
      const { service, repo, insertChain } = makeService({
        totpSecret: encryption.encrypt('SECRET123'),
      })

      await service.getConfig()

      expect(repo.upsert).not.toHaveBeenCalled()
      expect(insertChain.values).toHaveBeenCalledWith({ id: 1 })
      expect(insertChain.orIgnore).toHaveBeenCalled()
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

  describe('incrementTokenVersion', () => {
    it('should increment the tokenVersion column by 1', async () => {
      const { service, repo } = makeService({})

      await service.incrementTokenVersion()

      expect(repo.increment).toHaveBeenCalledWith({ id: 1 }, 'tokenVersion', 1)
    })
  })
})
