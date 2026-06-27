import './instrument'

import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe, RequestMethod } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { join } from 'path'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cookieParser())

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))

  const allowedOrigin = process.env.FRONTEND_URL
  if (!allowedOrigin) {
    throw new Error('FRONTEND_URL env variable is not set')
  }
  const wwwOrigin = allowedOrigin.replace('https://', 'https://www.')
  app.enableCors({
    origin: [allowedOrigin, wwwOrigin],
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

  const port = process.env.PORT || 3001
  await app.listen(port)
  new Logger('Bootstrap').log(`Backend running on http://localhost:${port}/api`)
}
bootstrap()
