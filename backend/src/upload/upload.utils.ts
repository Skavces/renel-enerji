import { BadRequestException } from '@nestjs/common'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { unlink, rename } from 'fs/promises'
import { fileTypeFromFile } from 'file-type'
import sharp from 'sharp'

export const imageStorage = diskStorage({
  destination: './uploads',
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

export const logoFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  cb(null, ALLOWED_LOGO_MIMES.includes(file.mimetype))
}

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
  await rename(convertedPath, `./uploads/${seoName}`)
  return `/uploads/${seoName}`
}
