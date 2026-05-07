import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  private parseDateRange(startAt: string, endAt: string): [number, number] {
    const start = Number(startAt)
    const end = Number(endAt)
    if (!startAt || !endAt || isNaN(start) || isNaN(end)) {
      throw new BadRequestException('startAt and endAt are required numeric timestamps')
    }
    return [start, end]
  }

  @Get('stats')
  getStats(@Query('startAt') startAt: string, @Query('endAt') endAt: string) {
    const [start, end] = this.parseDateRange(startAt, endAt)
    return this.service.getStats(start, end)
  }

  @Get('pageviews')
  getPageviews(
    @Query('startAt') startAt: string,
    @Query('endAt') endAt: string,
    @Query('unit') unit: string,
  ) {
    const [start, end] = this.parseDateRange(startAt, endAt)
    return this.service.getPageviews(start, end, unit || 'day')
  }

  @Get('pages')
  getPages(@Query('startAt') startAt: string, @Query('endAt') endAt: string) {
    const [start, end] = this.parseDateRange(startAt, endAt)
    return this.service.getTopPages(start, end)
  }
}
