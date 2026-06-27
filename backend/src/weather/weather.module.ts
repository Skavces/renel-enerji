import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { WeatherController } from './weather.controller'

@Module({ imports: [ConfigModule], controllers: [WeatherController] })
export class WeatherModule {}
