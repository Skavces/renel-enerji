import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const PREFIX = 'enc:v1:'

@Injectable()
export class EncryptionService {
  private readonly key: Buffer

  constructor(cfg: ConfigService) {
    const hex = cfg.get<string>('APP_ENCRYPTION_KEY') ?? ''
    if (!/^[0-9a-f]{64}$/i.test(hex)) {
      throw new Error('APP_ENCRYPTION_KEY 64 karakterlik hex olmalı (openssl rand -hex 32 ile üretin)')
    }
    this.key = Buffer.from(hex, 'hex')
  }

  isEncrypted(value: string): boolean {
    return value.startsWith(PREFIX)
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`
  }

  decrypt(value: string): string {
    const [iv, tag, ciphertext] = value.slice(PREFIX.length).split(':')
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  }
}
