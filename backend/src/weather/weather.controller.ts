import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('weather')
export class WeatherController {
  @UseGuards(JwtAuthGuard)
  @Get()
  async getWeather(@Query('city') city: string) {
    if (!city || city.length > 100) throw new BadRequestException('Geçersiz şehir adı')
    const key = process.env.OPENWEATHER_API_KEY
    if (!key) throw new BadRequestException('OpenWeather API anahtarı yapılandırılmamış')
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=tr`
    const res = await fetch(url)
    return res.json()
  }
}
