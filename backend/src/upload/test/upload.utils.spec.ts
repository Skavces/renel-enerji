import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileTypeFromFile } from 'file-type'
import { assertMagicBytesFromBuffer, toWebp, ALLOWED_IMAGE_MIMES } from '../upload.utils'

// 1x1 şeffaf piksel — gerçek PNG magic byte'larıyla mutlu yol testi için
const REAL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

// GIF89a magic byte'ları — 0.35.3'ün yamaladığı nsgif loader'ı bu türü hedefliyor
const GIF_HEADER = Buffer.from('47494638396100000000', 'hex')

describe('assertMagicBytesFromBuffer', () => {
  it('gerçek bir PNG buffer\'ını kabul eder', async () => {
    await expect(assertMagicBytesFromBuffer(REAL_PNG, ALLOWED_IMAGE_MIMES)).resolves.toBe(
      'image/png',
    )
  })

  it('allowlist dışı bir türü (GIF) reddeder', async () => {
    await expect(assertMagicBytesFromBuffer(GIF_HEADER, ALLOWED_IMAGE_MIMES)).rejects.toThrow(
      'Dosya içeriği izin verilen türlerle eşleşmiyor',
    )
  })

  it('rastgele metni reddeder', async () => {
    const text = Buffer.from('bu bir görsel değil, düz metin')
    await expect(assertMagicBytesFromBuffer(text, ALLOWED_IMAGE_MIMES)).rejects.toThrow(
      'Dosya içeriği izin verilen türlerle eşleşmiyor',
    )
  })
})

describe('toWebp', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'renel-towebp-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('gerçekten decode edilebilir bir WebP dosyası üretir (sharp sürüm regresyonu koruması)', async () => {
    const src = join(dir, 'kaynak.png')
    await writeFile(src, REAL_PNG)

    const outPath = await toWebp(src)

    expect(outPath).toBe(join(dir, 'kaynak.webp'))
    const detected = await fileTypeFromFile(outPath)
    expect(detected?.mime).toBe('image/webp')
  })
})
