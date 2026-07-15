import { BadRequestException, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { unlink } from 'fs/promises'
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
    // Multer dosyayı controller çalışmadan önce diske yazar; bu noktadan sonra
    // hangi adımda hata olursa olsun diskte artık dosya bırakılmamalı
    let currentPath = file.path
    try {
      // Önce referans var mı: 404'ü görsel işlenmeden ver
      await this.referencesService.findById(id)
      await assertMagicBytes(currentPath, ALLOWED_IMAGE_MIMES)
      currentPath = await toWebp(currentPath)
      const filename = currentPath.split('/').pop()
      return await this.referencesService.update(id, { logo: `/uploads/${filename}` })
    } catch (err) {
      // assertMagicBytes kendi hatasında dosyayı zaten silmiş olabilir — sessiz geç
      await unlink(currentPath).catch(() => {})
      throw err
    }
  }
}
