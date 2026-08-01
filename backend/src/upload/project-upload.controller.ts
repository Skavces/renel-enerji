import { Body, Controller, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { unlink } from 'fs/promises'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LinkMediaDto } from './dto/link-media.dto'
import { ProjectsService } from '../projects/projects.service'
import { MediaService } from '../projects/media.service'
import { MediaType, ProjectMedia } from '../projects/entities/project-media.entity'
import { deleteUploadedFile } from './uploaded-files'
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
    // Multer dosyaları controller çalışmadan önce diske yazar; bu noktadan sonra
    // hangi dosyada/adımda hata olursa olsun diskte artık DB'nin sahiplenmediği
    // dosya bırakılmamalı. pendingPaths henüz SEO adıyla kaydedilmemiş dosyaları,
    // pendingSrcs ise kaydedilmiş ama DB'ye henüz yazılmamış olanları tutar.
    const pendingPaths = new Set(files.map(f => f.path))
    const pendingSrcs = new Set<string>()
    const discardPending = () =>
      Promise.all([
        ...[...pendingPaths].map(p => unlink(p).catch(() => {})),
        ...[...pendingSrcs].map(src => deleteUploadedFile(src)),
      ])

    try {
      // Önce proje var mı: 404'ü tek bir dosya işlenmeden ver
      const project = await this.projectsService.findById(projectId)
      const results: ProjectMedia[] = []
      for (const file of files) {
        let currentPath = file.path
        const detectedMime = await assertMagicBytes(currentPath, ALLOWED_MEDIA_MIMES)
        const isVideo = VIDEO_MIMES.includes(detectedMime)
        const ext = isVideo ? (videoExtMap[detectedMime] ?? '.mp4') : '.webp'
        if (!isVideo) {
          currentPath = await toWebp(currentPath)
          pendingPaths.delete(file.path)
          pendingPaths.add(currentPath)
        }
        const src = await saveWithSeoName(currentPath, project.slug, ext)
        pendingPaths.delete(currentPath)
        pendingSrcs.add(src)
        const media = await this.mediaService.addMedia(projectId, isVideo ? MediaType.VIDEO : MediaType.IMAGE, src)
        pendingSrcs.delete(src)
        results.push(media)
      }
      return results
    } catch (err) {
      await discardPending()
      throw err
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/media/link')
  linkMedia(@Param('id') projectId: string, @Body() dto: LinkMediaDto) {
    const type = /\.(mp4|mov|webm)$/i.test(dto.src) ? MediaType.VIDEO : MediaType.IMAGE
    return this.mediaService.addMedia(projectId, type, dto.src)
  }
}
