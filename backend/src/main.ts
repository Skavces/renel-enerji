import './instrument'

import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe, RequestMethod } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { join } from 'path'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { DbLogger } from './logs/db-logger.service'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true, bufferLogs: true })

  // Tüm Logger.error/warn çağrıları veritabanına da yazılır (admin panel → Loglar)
  app.useLogger(app.get(DbLogger))

  // Trust the first proxy hop (Nginx) so req.ip reflects the real client IP
  app.set('trust proxy', 1)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cookieParser())

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))

  const allowedOrigin = process.env.FRONTEND_URL
  if (!allowedOrigin) {
    throw new Error('FRONTEND_URL env variable is not set')
  }
  const originUrl = new URL(allowedOrigin)
  const wwwOrigins: string[] = []
  const isIp = /^[\d.]+$/.test(originUrl.hostname)
  if (!originUrl.hostname.startsWith('www.') && !isIp) {
    originUrl.hostname = `www.${originUrl.hostname}`
    wwwOrigins.push(originUrl.toString().replace(/\/$/, ''))
  }
  app.enableCors({
    origin: [allowedOrigin, ...wwwOrigins],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'sitemap.xml', method: RequestMethod.GET }],
  })

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Renel Enerji API')
      .setDescription('Renel Enerji backend API dokümantasyonu')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  app.enableShutdownHooks()

  const port = process.env.PORT || 3001
  await app.listen(port)
  new Logger('Bootstrap').log(`Backend running on http://localhost:${port}/api`)
}
bootstrap()
