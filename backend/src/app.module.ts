import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup'
import { AuthModule } from './auth/auth.module'
import { ProjectsModule } from './projects/projects.module'
import { UploadModule } from './upload/upload.module'
import { ReferencesModule } from './references/references.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { BlogModule } from './blog/blog.module'
import { FaqModule } from './faq/faq.module'
import { SitemapModule } from './sitemap/sitemap.module'
import { ChatModule } from './chat/chat.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { InstagramTokenModule } from './instagram-token/instagram-token.module'
import { GroqModule } from './groq/groq.module'
import { WeatherController } from './weather/weather.controller'
import { HealthController } from './health.controller'

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    SitemapModule,
    ChatModule,
    WebhooksModule,
    InstagramTokenModule,
    GroqModule,
  ],
  controllers: [WeatherController, HealthController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
