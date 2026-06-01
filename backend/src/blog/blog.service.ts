import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BlogPost } from './entities/blog-post.entity'
import { CreateBlogPostDto } from './dto/create-blog-post.dto'
import { UpdateBlogPostDto } from './dto/update-blog-post.dto'

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPost)
    private repo: Repository<BlogPost>,
  ) {}

  findAllPublic() {
    return this.repo.find({
      where: { published: true },
      order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
      select: ['id', 'title', 'slug', 'excerpt', 'coverImage', 'publishedAt', 'createdAt'],
    })
  }

  findAll() {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } })
  }

  async findBySlug(slug: string) {
    const post = await this.repo.findOne({ where: { slug, published: true } })
    if (!post) throw new NotFoundException('Yazı bulunamadı')
    return post
  }

  async findById(id: string) {
    const post = await this.repo.findOne({ where: { id } })
    if (!post) throw new NotFoundException('Yazı bulunamadı')
    return post
  }

  async create(dto: CreateBlogPostDto) {
    const existing = await this.repo.findOne({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Bu slug zaten kullanımda')
    const post = this.repo.create(dto)
    if (dto.published && !post.publishedAt) post.publishedAt = new Date()
    return this.repo.save(post)
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.findById(id)
    if (dto.slug && dto.slug !== post.slug) {
      const existing = await this.repo.findOne({ where: { slug: dto.slug } })
      if (existing) throw new ConflictException('Bu slug zaten kullanımda')
    }
    if (dto.published && !post.published && !post.publishedAt) {
      post.publishedAt = new Date()
    }
    Object.assign(post, dto)
    return this.repo.save(post)
  }

  async remove(id: string) {
    const post = await this.findById(id)
    await this.repo.remove(post)
  }

  async reorder(orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, index) => this.repo.update(id, { sortOrder: index })),
    )
  }
}
