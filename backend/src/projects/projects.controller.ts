import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  HttpCode,
} from '@nestjs/common'
import { ProjectsService } from './projects.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  // Public endpoints
  @Get()
  findAll() {
    return this.service.findAllPublic()
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  // Admin endpoints
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllAdmin() {
    return this.service.findAll()
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/instagram-sync')
  @HttpCode(200)
  syncInstagram() {
    this.service.syncInstagram().catch(() => {})
    return { status: 'started' }
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/parse-instagram')
  @HttpCode(200)
  parseInstagram(@Body() body: { text: string }) {
    return this.service.parseInstagram(body.text)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorderProjects(@Body() body: { orderedIds: string[] }) {
    return this.service.reorderProjects(body.orderedIds)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':projectId/media/:mediaId')
  removeMedia(
    @Param('projectId') projectId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.service.removeMedia(projectId, mediaId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/media/reorder')
  reorderMedia(@Param('id') id: string, @Body() body: { orderedIds: string[] }) {
    return this.service.reorderMedia(id, body.orderedIds)
  }
}
