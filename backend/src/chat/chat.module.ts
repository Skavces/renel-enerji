import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatRatingService } from './chat-rating.service'
import { ChatLeadService } from './chat-lead.service'
import { ChatRetentionService } from './chat-retention.service'
import { ChatStatsService } from './chat-stats.service'
import { ChatRating } from './entities/chat-rating.entity'
import { ChatLead } from './entities/chat-lead.entity'
import { ChatDailyStat } from './entities/chat-daily-stat.entity'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([ChatRating, ChatLead, ChatDailyStat]), NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRatingService, ChatLeadService, ChatRetentionService, ChatStatsService],
})
export class ChatModule {}
