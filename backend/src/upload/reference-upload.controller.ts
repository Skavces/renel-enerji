import { BadRequestException, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ReferencesService } from '../references/references.service'
import { imageStorage, ALLOWED_IMAGE_MIMES, logoFilter, assertMagicBytes, toWebp } from './upload.utils'

@Controller('upload/references')
export class ReferenceUploadController {
  constructor(private referencesService: ReferencesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage, fileFilter: logoFilter, limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Geçerli bir görsel yükleyin (JPEG, PNG veya WEBP)')
    await assertMagicBytes(file.path, ALLOWED_IMAGE_MIMES)
    const finalPath = await toWebp(file.path)
    const filename = finalPath.split('/').pop()
    return this.referencesService.update(id, { logo: `/uploads/${filename}` })
  }
}
