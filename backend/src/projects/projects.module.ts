import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from './entities/project.entity'
import { ProjectMedia } from './entities/project-media.entity'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'
import { InstagramSyncService } from './instagram-sync.service'

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMedia])],
  controllers: [ProjectsController],
  providers: [ProjectsService, InstagramSyncService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
