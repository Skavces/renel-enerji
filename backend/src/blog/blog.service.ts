import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, FindManyOptions, Repository } from 'typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { BaseContentService } from '../common/base-content.service'
import { PublicCacheService } from '../common/public-cache.service'
import { sanitizeRichHtml, stripHtml } from '../common/html-sanitize'

@Injectable()
export class BlogService extends BaseContentService<BlogPost> {
  protected readonly entityClass = BlogPost
  protected readonly notFoundMessage = 'Yazı bulunamadı'
  protected readonly fileField = 'coverImage'
  protected readonly uniqueConflictMessage = 'Bu slug zaten kullanımda'

  constructor(@InjectRepository(BlogPost) repo: Repository<BlogPost>, cache: PublicCacheService) {
    super(repo, cache)
  }

  // Public liste hafif alanlarla ve yayın tarihine göre döner
  protected publicFindOptions(): FindManyOptions<BlogPost> {
    return {
      where: { published: true },
      order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
      select: ['id', 'title', 'slug', 'excerpt', 'coverImage', 'publishedAt', 'createdAt'],
    }
  }

  // İlk kez yayınlanırken publishedAt damgalanır; HTML içerik yazma anında
  // sunucuda da temizlenir (render'daki DOMPurify tek savunma olmasın)
  protected onCreate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.publishedAt) post.publishedAt = new Date()
    if (typeof post.content === 'string') post.content = sanitizeRichHtml(post.content)
    if (typeof post.excerpt === 'string') post.excerpt = stripHtml(post.excerpt)
  }

  // update() dto'yu hook'tan SONRA entity'ye kopyalar — burada dto temizlenir
  protected onUpdate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.published && !post.publishedAt) post.publishedAt = new Date()
    if (typeof dto.content === 'string') dto.content = sanitizeRichHtml(dto.content)
    if (typeof dto.excerpt === 'string') dto.excerpt = stripHtml(dto.excerpt)
  }

  findBySlug(slug: string) {
    return this.cache.wrap(this.cacheKey(`slug:${slug}`), async () => {
      const post = await this.repo.findOne({ where: { slug, published: true } })
      if (!post) throw new NotFoundException('Yazı bulunamadı')
      return post
    })
  }
}
