import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'

const ALLOWED_UNITS = new Set(['hour', 'day', 'month', 'year'])
const ALLOWED_METRICS = new Set(['referrer', 'browser', 'os', 'device', 'country', 'language'])

@Controller('dash')
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
    const safeUnit = unit || 'day'
    if (!ALLOWED_UNITS.has(safeUnit)) {
      throw new BadRequestException('unit must be one of: hour, day, month, year')
    }
    return this.service.getPageviews(start, end, safeUnit)
  }

  @Get('pages')
  getPages(@Query('startAt') startAt: string, @Query('endAt') endAt: string) {
    const [start, end] = this.parseDateRange(startAt, endAt)
    return this.service.getTopPages(start, end)
  }

  @Get('metrics')
  getMetrics(
    @Query('startAt') startAt: string,
    @Query('endAt') endAt: string,
    @Query('type') type: string,
  ) {
    const [start, end] = this.parseDateRange(startAt, endAt)
    if (!type || !ALLOWED_METRICS.has(type)) {
      throw new BadRequestException(`type must be one of: ${[...ALLOWED_METRICS].join(', ')}`)
    }
    return this.service.getMetrics(type, start, end)
  }
}
