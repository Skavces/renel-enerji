import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { redactUrlSecrets } from './redact'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req
    const start = Date.now()

    res.on('finish', () => {
      const ms = Date.now() - start
      const { statusCode } = res
      const sanitizedUrl = redactUrlSecrets(originalUrl)
      this.logger.log(`${method} ${sanitizedUrl} ${statusCode} ${ms}ms`)
    })

    next()
  }
}
