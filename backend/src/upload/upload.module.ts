import { Module } from '@nestjs/common'
import { ProjectUploadController } from './project-upload.controller'
import { ReferenceUploadController } from './reference-upload.controller'
import { BlogUploadController } from './blog-upload.controller'
import { ProjectsModule } from '../projects/projects.module'
import { ReferencesModule } from '../references/references.module'
import { BlogModule } from '../blog/blog.module'

@Module({
  imports: [ProjectsModule, ReferencesModule, BlogModule],
  controllers: [ProjectUploadController, ReferenceUploadController, BlogUploadController],
})
export class UploadModule {}
