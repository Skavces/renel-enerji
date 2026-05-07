import { Module } from '@nestjs/common'
import { UploadController } from './upload.controller'
import { ProjectsModule } from '../projects/projects.module'
import { ReferencesModule } from '../references/references.module'

@Module({
  imports: [ProjectsModule, ReferencesModule],
  controllers: [UploadController],
})
export class UploadModule {}
