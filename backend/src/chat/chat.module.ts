import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { ChatRatingService } from './chat-rating.service'
import { ChatRating } from './entities/chat-rating.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ChatRating])],
  controllers: [ChatController],
  providers: [ChatService, ChatRatingService],
})
export class ChatModule {}
