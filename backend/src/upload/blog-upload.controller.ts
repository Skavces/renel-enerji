import { BadRequestException, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { rename, unlink } from 'fs/promises'
import { join } from 'path'
import { UPLOADS_DIR } from './uploaded-files'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { BlogService } from '../blog/blog.service'
import { imageStorage, ALLOWED_IMAGE_MIMES, logoFilter, assertMagicBytes, toWebp, SEO_SUFFIX } from './upload.utils'

@Controller('upload/blog')
export class BlogUploadController {
  constructor(private blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage, fileFilter: logoFilter, limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadCover(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Geçerli bir görsel yükleyin (JPEG, PNG veya WEBP)')
    // Multer dosyayı controller çalışmadan önce diske yazar; bu noktadan sonra
    // hangi adımda hata olursa olsun diskte artık dosya bırakılmamalı
    let currentPath = file.path
    try {
      // Önce post var mı: 404'ü görsel işlenmeden ver
      const post = await this.blogService.findById(id)
      await assertMagicBytes(currentPath, ALLOWED_IMAGE_MIMES)
      currentPath = await toWebp(currentPath)
      const seoName = `${post.slug}-${SEO_SUFFIX}-${Date.now()}.webp`
      await rename(currentPath, join(UPLOADS_DIR, seoName))
      currentPath = join(UPLOADS_DIR, seoName)
      return await this.blogService.update(id, { coverImage: `/uploads/${seoName}` })
    } catch (err) {
      // assertMagicBytes kendi hatasında dosyayı zaten silmiş olabilir — sessiz geç
      await unlink(currentPath).catch(() => {})
      throw err
    }
  }
}
