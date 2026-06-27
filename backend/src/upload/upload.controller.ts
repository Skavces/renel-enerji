import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { unlinkSync, renameSync } from 'fs'
import { fromFile } from 'file-type'
import sharp from 'sharp'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LinkMediaDto } from './dto/link-media.dto'
import { ProjectsService } from '../projects/projects.service'
import { ReferencesService } from '../references/references.service'
import { BlogService } from '../blog/blog.service'

const imageStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${extname(file.originalname)}`)
  },
})

const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm']

async function toWebp(filePath: string): Promise<string> {
  const webpPath = filePath.replace(/\.[^.]+$/, '.webp')
  if (filePath === webpPath) return filePath
  await sharp(filePath).webp({ quality: 82 }).toFile(webpPath)
  unlinkSync(filePath)
  return webpPath
}

// Y-01: SVG tamamen yasaklandı — sadece PNG/WEBP/JPG/JPEG kabul edilir
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_LOGO_MIMES = [...ALLOWED_IMAGE_MIMES]
const ALLOWED_MEDIA_MIMES = [...ALLOWED_IMAGE_MIMES, 'video/mp4', 'video/quicktime', 'video/webm']

// Y-03: MIME'den uzantı haritası
const videoExtMap: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
}

const logoFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  cb(null, ALLOWED_LOGO_MIMES.includes(file.mimetype))
}

async function assertMagicBytes(filePath: string, allowedMimes: string[]): Promise<void> {
  const detected = await fromFile(filePath)
  if (!detected || !allowedMimes.includes(detected.mime)) {
    unlinkSync(filePath)
    throw new BadRequestException('Dosya içeriği izin verilen türlerle eşleşmiyor')
  }
}

@Controller('upload')
export class UploadController {
  constructor(
    private projectsService: ProjectsService,
    private referencesService: ReferencesService,
    private blogService: BlogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('projects/:id/media')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: imageStorage,
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MEDIA_MIMES.includes(file.mimetype))
      },
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async uploadMedia(
    @Param('id') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const project = await this.projectsService.findById(projectId)
    const results = []
    for (const file of files) {
      await assertMagicBytes(file.path, ALLOWED_MEDIA_MIMES)
      const isVideo = VIDEO_MIMES.includes(file.mimetype)
      const converted = isVideo ? file.path : await toWebp(file.path)
      // Y-03: Video uzantısını MIME'den al, orijinal dosya adına güvenme
      const ext = isVideo ? (videoExtMap[file.mimetype] ?? '.mp4') : '.webp'
      const seoName = `${project.slug}-gunes-enerjisi-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`
      const seoPath = `./uploads/${seoName}`
      renameSync(converted, seoPath)
      const src = `/uploads/${seoName}`
      const media = await this.projectsService.addMedia(projectId, isVideo ? 'video' : 'image', src)
      results.push(media)
    }
    return results
  }

  @UseGuards(JwtAuthGuard)
  @Post('projects/:id/media/link')
  async linkMedia(@Param('id') projectId: string, @Body() dto: LinkMediaDto) {
    const type = /\.(mp4|mov|webm)$/i.test(dto.src) ? 'video' : 'image'
    return this.projectsService.addMedia(projectId, type, dto.src)
  }

  @UseGuards(JwtAuthGuard)
  @Post('references/:id/logo')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage, fileFilter: logoFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadReferenceLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Geçerli bir görsel yükleyin (JPEG, PNG veya WEBP)')
    await assertMagicBytes(file.path, ALLOWED_IMAGE_MIMES)
    const finalPath = await toWebp(file.path)
    const filename = finalPath.split('/').pop()
    const logo = `/uploads/${filename}`
    return this.referencesService.update(id, { logo })
  }

  @UseGuards(JwtAuthGuard)
  @Post('blog/:id/cover')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage, fileFilter: logoFilter, limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadBlogCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Geçerli bir görsel yükleyin (JPEG, PNG veya WEBP)')
    await assertMagicBytes(file.path, ALLOWED_IMAGE_MIMES)
    const post = await this.blogService.findById(id)
    const finalPath = await toWebp(file.path)
    const seoName = `${post.slug}-gunes-enerjisi-${Date.now()}.webp`
    const seoPath = `./uploads/${seoName}`
    renameSync(finalPath, seoPath)
    const coverImage = `/uploads/${seoName}`
    return this.blogService.update(id, { coverImage })
  }
}
