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
    const post = this.repo.create(dto)
    if (dto.published && !post.publishedAt) post.publishedAt = new Date()
    try {
      return await this.repo.save(post)
    } catch (err: any) {
      if (err.code === '23505') throw new ConflictException('Bu slug zaten kullanımda')
      throw err
    }
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.findById(id)
    if (dto.published && !post.published && !post.publishedAt) {
      post.publishedAt = new Date()
    }
    Object.assign(post, dto)
    try {
      return await this.repo.save(post)
    } catch (err: any) {
      if (err.code === '23505') throw new ConflictException('Bu slug zaten kullanımda')
      throw err
    }
  }

  async remove(id: string) {
    const post = await this.findById(id)
    await this.repo.remove(post)
  }

  async reorder(orderedIds: string[]) {
    await this.repo.manager.transaction(async (manager) => {
      await Promise.all(
        orderedIds.map((id, index) => manager.update(BlogPost, id, { sortOrder: index })),
      )
    })
  }
}
