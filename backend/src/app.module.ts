import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as Joi from 'joi'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { TerminusModule } from '@nestjs/terminus'
import { APP_GUARD, APP_FILTER } from '@nestjs/core'
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup'
import { LoggingMiddleware } from './common/logging.middleware'
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
import { WeatherModule } from './weather/weather.module'
import { NotificationsModule } from './notifications/notifications.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        APP_ENCRYPTION_KEY: Joi.string().pattern(/^[0-9a-f]{64}$/i).required(),
        DB_PASS: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        FRONTEND_URL: Joi.string().uri().required(),
        NODE_ENV: Joi.string().valid('development', 'production').default('development'),
        ADMIN_PASSWORD_HASH: Joi.string().required(),
        GROQ_API_KEY: Joi.string().required(),
        INSTAGRAM_APP_SECRET: Joi.string().required(),
        INSTAGRAM_WEBHOOK_VERIFY_TOKEN: Joi.string().required(),
        UMAMI_PASS: Joi.string().required(),
        // Compose ${VAR:-} boş string geçirir — boş değer "tanımsız" sayılır (bildirimler kapalı)
        NTFY_URL: Joi.string().uri().allow('').optional(),
        NTFY_TOPIC: Joi.string().allow('').optional(),
        NTFY_TOKEN: Joi.string().allow('').optional(),
      }),
      validationOptions: { allowUnknown: true },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 60 }],
        getTracker: (req: any) => req.ip ?? req.connection?.remoteAddress ?? 'unknown',
      }),
    }),
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
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
      }),
    }),
    TerminusModule,
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
    WeatherModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('{*splat}')
  }
}
