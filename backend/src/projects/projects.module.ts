import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Project } from './entities/project.entity'
import { ProjectMedia } from './entities/project-media.entity'
import { ProjectsController } from './projects.controller'
import { ProjectsService } from './projects.service'
import { MediaService } from './media.service'
import { InstagramParseService } from './instagram-parse.service'
import { InstagramImportService } from './instagram-import.service'
@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectMedia])],
  controllers: [ProjectsController],
  providers: [ProjectsService, MediaService, InstagramParseService, InstagramImportService],
  exports: [ProjectsService, MediaService, InstagramImportService],
})
export class ProjectsModule {}
