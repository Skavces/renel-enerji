import { BadRequestException } from '@nestjs/common'
import { diskStorage } from 'multer'
import type { FileFilterCallback } from 'multer'
import type { Request } from 'express'
import { extname, join } from 'path'
import { unlink, rename } from 'fs/promises'
import { fileTypeFromFile } from 'file-type'
import sharp from 'sharp'
import { UPLOADS_DIR } from './uploaded-files'

export const imageStorage = diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${extname(file.originalname)}`)
  },
})

export const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm']

// SVG tamamen yasaklandı — sadece PNG/WEBP/JPG/JPEG kabul edilir
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_LOGO_MIMES = [...ALLOWED_IMAGE_MIMES]
export const ALLOWED_MEDIA_MIMES = [...ALLOWED_IMAGE_MIMES, 'video/mp4', 'video/quicktime', 'video/webm']

// Video uzantısını MIME'den al, orijinal dosya adına güvenme
export const SEO_SUFFIX = 'gunes-enerjisi'

export const videoExtMap: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
}

// Sessizce reddetme (cb(null,false)) dosyayı yutup 200 dönüyordu; kullanıcı
// "yükledim ama görünmüyor" yaşıyordu. İzin dışı türde açık 400 dönülür.
export const mimeFilter =
  (allowedMimes: string[]) => (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (allowedMimes.includes(file.mimetype)) return cb(null, true)
    cb(
      new BadRequestException(
        `Desteklenmeyen dosya türü: ${file.mimetype || 'bilinmiyor'} (${file.originalname})`,
      ),
    )
  }

export const logoFilter = mimeFilter(ALLOWED_LOGO_MIMES)

export async function toWebp(filePath: string): Promise<string> {
  const webpPath = filePath.replace(/\.[^.]+$/, '.webp')
  if (filePath === webpPath) return filePath
  await sharp(filePath).webp({ quality: 82 }).toFile(webpPath)
  await unlink(filePath)
  return webpPath
}

export async function assertMagicBytes(filePath: string, allowedMimes: string[]): Promise<string> {
  const detected = await fileTypeFromFile(filePath)
  if (!detected || !allowedMimes.includes(detected.mime)) {
    await unlink(filePath)
    throw new BadRequestException('Dosya içeriği izin verilen türlerle eşleşmiyor')
  }
  return detected.mime
}

export async function saveWithSeoName(
  convertedPath: string,
  slug: string,
  ext: string,
): Promise<string> {
  const seoName = `${slug}-${SEO_SUFFIX}-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`
  await rename(convertedPath, join(UPLOADS_DIR, seoName))
  return `/uploads/${seoName}`
}
