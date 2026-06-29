import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req
    const start = Date.now()

    res.on('finish', () => {
      const ms = Date.now() - start
      const { statusCode } = res
      const sanitizedUrl = originalUrl.replace(
        /(hub\.verify_token|access_token|token|secret|password)=[^&]*/gi,
        '$1=[REDACTED]',
      )
      this.logger.log(`${method} ${sanitizedUrl} ${statusCode} ${ms}ms`)
    })

    next()
  }
}
