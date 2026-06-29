import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { fetchWithTimeout } from '../common/fetch-with-timeout'

@Injectable()
export class WeatherService {
  constructor(private readonly cfg: ConfigService) {}

  async fetchWeather(city: string): Promise<unknown> {
    const key = this.cfg.get<string>('OPENWEATHER_API_KEY')
    if (!key) throw new BadRequestException('OpenWeather API anahtarı yapılandırılmamış')
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=tr`
    const res = await fetchWithTimeout(url)
    if (!res.ok) throw new BadRequestException(`Hava durumu alınamadı: ${res.status}`)
    return res.json()
  }
}
