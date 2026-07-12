import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectUploadController } from './project-upload.controller'
import { ReferenceUploadController } from './reference-upload.controller'
import { BlogUploadController } from './blog-upload.controller'
import { UploadsCleanupService } from './uploads-cleanup.service'
import { ProjectsModule } from '../projects/projects.module'
import { ReferencesModule } from '../references/references.module'
import { BlogModule } from '../blog/blog.module'
import { ProjectMedia } from '../projects/entities/project-media.entity'
import { BlogPost } from '../blog/entities/blog-post.entity'
import { Reference } from '../references/entities/reference.entity'

@Module({
  imports: [
    ProjectsModule,
    ReferencesModule,
    BlogModule,
    TypeOrmModule.forFeature([ProjectMedia, BlogPost, Reference]),
  ],
  controllers: [ProjectUploadController, ReferenceUploadController, BlogUploadController],
  providers: [UploadsCleanupService],
})
export class UploadModule {}
