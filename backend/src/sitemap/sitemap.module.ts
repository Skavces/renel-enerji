import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { Project } from '../projects/entities/project.entity'
import { SitemapController } from './sitemap.controller'
import { SitemapService } from './sitemap.service'

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, Project])],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
