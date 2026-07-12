import { Module } from '@nestjs/common'
import { NtfyService } from './ntfy.service'
import { NtfyLogger } from './ntfy-logger.service'

@Module({
  providers: [NtfyService, NtfyLogger],
  exports: [NtfyService, NtfyLogger],
})
export class NotificationsModule {}
