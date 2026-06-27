import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

@Controller('weather')
export class WeatherController {
  constructor(private readonly config: ConfigService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getWeather(@Query('city') city: string) {
    if (!city || city.length > 100) throw new BadRequestException('Geçersiz şehir adı')
    const key = this.config.get<string>('OPENWEATHER_API_KEY')
    if (!key) throw new BadRequestException('OpenWeather API anahtarı yapılandırılmamış')
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=tr`
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new BadRequestException(`Hava durumu alınamadı: ${res.status}`)
    return res.json()
  }
}
