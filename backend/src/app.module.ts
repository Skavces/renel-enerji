import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { ProjectsModule } from './projects/projects.module'
import { UploadModule } from './upload/upload.module'
import { ReferencesModule } from './references/references.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { BlogModule } from './blog/blog.module'
import { FaqModule } from './faq/faq.module'
import { WeatherController } from './weather/weather.controller'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USER', 'postgres'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME', 'renel_enerji'),
        autoLoadEntities: true,
        synchronize: cfg.get('DB_SYNC', 'false') === 'true',
      }),
    }),
    AuthModule,
    ProjectsModule,
    UploadModule,
    ReferencesModule,
    AnalyticsModule,
    BlogModule,
    FaqModule,
  ],
  controllers: [WeatherController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
