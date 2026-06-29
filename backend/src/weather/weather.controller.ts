import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WeatherService } from './weather.service'

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getWeather(@Query('city') city: string) {
    if (!city || city.length > 100) throw new BadRequestException('Geçersiz şehir adı')
    return this.weatherService.fetchWeather(city)
  }
}
