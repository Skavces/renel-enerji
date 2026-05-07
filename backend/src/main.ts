import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))

  const allowedOrigin = process.env.FRONTEND_URL
  if (!allowedOrigin) {
    throw new Error('FRONTEND_URL env variable is not set')
  }
  app.enableCors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })
  app.setGlobalPrefix('api')

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`Backend running on http://localhost:${port}/api`)
}
bootstrap()
