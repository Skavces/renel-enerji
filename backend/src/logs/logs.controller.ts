import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { LogsService } from './logs.service'
import { LogLevel } from './entities/app-log.entity'

@Controller('logs')
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAll(@Query('level') level?: string) {
    const narrowed: LogLevel | undefined = level === 'error' || level === 'warn' ? level : undefined
    return this.service.findAllWithStats(narrowed)
  }
}
