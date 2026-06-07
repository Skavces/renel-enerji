import { Controller, Get } from '@nestjs/common'

// Temporary — Sentry kurulumunu doğrulamak için. Doğrulandıktan sonra kaldırılacak.
@Controller('debug-sentry')
export class DebugSentryController {
  @Get()
  getError() {
    throw new Error('My first Sentry error!')
  }
}
