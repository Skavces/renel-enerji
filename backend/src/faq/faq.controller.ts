import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { FaqService } from './faq.service'
import { CreateFaqDto } from './dto/create-faq.dto'
import { UpdateFaqDto } from './dto/update-faq.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('faq')
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Get()
  findAll() {
    return this.service.findAllPublic()
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllAdmin() {
    return this.service.findAll()
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateFaqDto) {
    return this.service.create(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  reorder(@Body() body: { orderedIds: string[] }) {
    return this.service.reorder(body.orderedIds)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.service.update(id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
