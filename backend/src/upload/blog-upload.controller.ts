import { BadRequestException, Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { rename } from 'fs/promises'
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
    await assertMagicBytes(file.path, ALLOWED_IMAGE_MIMES)
    const post = await this.blogService.findById(id)
    const finalPath = await toWebp(file.path)
    const seoName = `${post.slug}-${SEO_SUFFIX}-${Date.now()}.webp`
    await rename(finalPath, `./uploads/${seoName}`)
    return this.blogService.update(id, { coverImage: `/uploads/${seoName}` })
  }
}
