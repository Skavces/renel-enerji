import { Body, Controller, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { unlink } from 'fs/promises'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LinkMediaDto } from './dto/link-media.dto'
import { ProjectsService } from '../projects/projects.service'
import { MediaService } from '../projects/media.service'
import { MediaType, ProjectMedia } from '../projects/entities/project-media.entity'
import {
  imageStorage,
  VIDEO_MIMES,
  ALLOWED_MEDIA_MIMES,
  videoExtMap,
  assertMagicBytes,
  mimeFilter,
  toWebp,
  saveWithSeoName,
} from './upload.utils'

@Controller('upload/projects')
export class ProjectUploadController {
  constructor(
    private projectsService: ProjectsService,
    private mediaService: MediaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/media')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: imageStorage,
      fileFilter: mimeFilter(ALLOWED_MEDIA_MIMES),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  async uploadMedia(
    @Param('id') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const project = await this.projectsService.findById(projectId)
    const results: ProjectMedia[] = []
    for (const file of files) {
      const detectedMime = await assertMagicBytes(file.path, ALLOWED_MEDIA_MIMES)
      const isVideo = VIDEO_MIMES.includes(detectedMime)
      const ext = isVideo ? (videoExtMap[detectedMime] ?? '.mp4') : '.webp'
      let src: string
      try {
        const converted = isVideo ? file.path : await toWebp(file.path)
        src = await saveWithSeoName(converted, project.slug, ext)
      } catch (err) {
        await unlink(file.path).catch(() => {})
        throw err
      }
      const media = await this.mediaService.addMedia(projectId, isVideo ? MediaType.VIDEO : MediaType.IMAGE, src)
      results.push(media)
    }
    return results
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/media/link')
  linkMedia(@Param('id') projectId: string, @Body() dto: LinkMediaDto) {
    const type = /\.(mp4|mov|webm)$/i.test(dto.src) ? MediaType.VIDEO : MediaType.IMAGE
    return this.mediaService.addMedia(projectId, type, dto.src)
  }
}
