import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  Req,
  Res,
  ForbiddenException,
  HttpCode,
  Logger,
} from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { timingSafeEqual } from 'crypto'
import type { Request, Response } from 'express'
import { WebhooksService } from './webhooks.service'

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @SkipThrottle()
  @Get('instagram')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
    @Res() res: Response,
  ) {
    const verifyToken = this.config.get<string>('INSTAGRAM_WEBHOOK_VERIFY_TOKEN') ?? ''
    const a = Buffer.from(token ?? '')
    const b = Buffer.from(verifyToken)
    const tokenValid = a.length === b.length && timingSafeEqual(a, b)
    if (mode === 'subscribe' && tokenValid) {
      this.logger.log('Instagram webhook doğrulandı')
      return res.type('text/plain').send(challenge)
    }
    throw new ForbiddenException('Geçersiz verify token')
  }

  @Post('instagram')
  @HttpCode(200)
  handleEvent(
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    if (!req.rawBody || !this.webhooksService.verifySignature(req.rawBody, signature)) {
      this.logger.warn('Geçersiz webhook imzası — istek reddedildi')
      throw new ForbiddenException('Geçersiz imza')
    }

    // Ağır iş arka planda; Meta'ya hemen 200 dönülür
    this.webhooksService.handleInstagramEvent(body)
    return { ok: true }
  }
}
