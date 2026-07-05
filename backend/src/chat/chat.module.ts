import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatRatingService } from './chat-rating.service'
import { ChatLeadService } from './chat-lead.service'
import { ChatRetentionService } from './chat-retention.service'
import { ChatRating } from './entities/chat-rating.entity'
import { ChatLead } from './entities/chat-lead.entity'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([ChatRating, ChatLead]), NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRatingService, ChatLeadService, ChatRetentionService],
})
export class ChatModule {}
