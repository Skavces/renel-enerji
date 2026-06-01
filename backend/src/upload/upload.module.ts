import { Module } from '@nestjs/common'
import { UploadController } from './upload.controller'
import { ProjectsModule } from '../projects/projects.module'
import { ReferencesModule } from '../references/references.module'
import { BlogModule } from '../blog/blog.module'

@Module({
  imports: [ProjectsModule, ReferencesModule, BlogModule],
  controllers: [UploadController],
})
export class UploadModule {}
