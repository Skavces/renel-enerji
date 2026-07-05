import { Module } from '@nestjs/common'
import { TelegramService } from './telegram.service'
import { TelegramLogger } from './telegram-logger.service'

@Module({
  providers: [TelegramService, TelegramLogger],
  exports: [TelegramService, TelegramLogger],
})
export class NotificationsModule {}
