import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  ForbiddenException,
  HttpCode,
  Logger,
} from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { WebhooksService } from './webhooks.service'

@SkipThrottle()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Get('instagram')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ) {
    const verifyToken = this.config.get<string>('INSTAGRAM_WEBHOOK_VERIFY_TOKEN')
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Instagram webhook doğrulandı')
      return parseInt(challenge, 10)
    }
    throw new ForbiddenException('Geçersiz verify token')
  }

  @Post('instagram')
  @HttpCode(200)
  async handleEvent(
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
  ) {
    if (!this.webhooksService.verifySignature(req.rawBody, signature)) {
      this.logger.warn('Geçersiz webhook imzası — istek reddedildi')
      throw new ForbiddenException('Geçersiz imza')
    }

    await this.webhooksService.handleInstagramEvent(body)
    return { ok: true }
  }
}
