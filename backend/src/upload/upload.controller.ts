import {
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ProjectsService } from '../projects/projects.service'
import { ReferencesService } from '../references/references.service'

const imageStorage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${extname(file.originalname)}`)
  },
})

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_MEDIA_MIMES = [...ALLOWED_IMAGE_MIMES, 'video/mp4', 'video/quicktime', 'video/webm']

const imageFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  cb(null, ALLOWED_IMAGE_MIMES.includes(file.mimetype))
}

@Controller('upload')
export class UploadController {
  constructor(
    private projectsService: ProjectsService,
    private referencesService: ReferencesService,
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
    const results = []
    for (const file of files) {
      const type = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.mimetype) ? 'video' : 'image'
      const src = `/uploads/${file.filename}`
      const media = await this.projectsService.addMedia(projectId, type, src)
      results.push(media)
    }
    return results
  }

  @UseGuards(JwtAuthGuard)
  @Post('references/:id/logo')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadReferenceLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const logo = `/uploads/${file.filename}`
    return this.referencesService.update(id, { logo })
  }
}
