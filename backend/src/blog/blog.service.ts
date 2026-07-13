import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DeepPartial, FindManyOptions, Repository } from 'typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { BaseContentService } from '../common/base-content.service'

@Injectable()
export class BlogService extends BaseContentService<BlogPost> {
  protected readonly entityClass = BlogPost
  protected readonly notFoundMessage = 'Yazı bulunamadı'
  protected readonly fileField = 'coverImage'
  protected readonly uniqueConflictMessage = 'Bu slug zaten kullanımda'

  constructor(@InjectRepository(BlogPost) repo: Repository<BlogPost>) {
    super(repo)
  }

  // Public liste hafif alanlarla ve yayın tarihine göre döner
  protected publicFindOptions(): FindManyOptions<BlogPost> {
    return {
      where: { published: true },
      order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
      select: ['id', 'title', 'slug', 'excerpt', 'coverImage', 'publishedAt', 'createdAt'],
    }
  }

  // İlk kez yayınlanırken publishedAt damgalanır
  protected onCreate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.publishedAt) post.publishedAt = new Date()
  }

  protected onUpdate(post: BlogPost, dto: DeepPartial<BlogPost>): void {
    if (dto.published && !post.published && !post.publishedAt) post.publishedAt = new Date()
  }

  async findBySlug(slug: string) {
    const post = await this.repo.findOne({ where: { slug, published: true } })
    if (!post) throw new NotFoundException('Yazı bulunamadı')
    return post
  }
}
