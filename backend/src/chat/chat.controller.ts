import { BadRequestException, Body, Controller, Get, Ip, Logger, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChatMessage, ChatService, INJECTION_PATTERNS, sanitizeContent } from './chat.service'
import { ChatRatingService } from './chat-rating.service'
import { ChatBodyDto, SummaryBodyDto } from './dto/chat-body.dto'
import { RatingBodyDto } from './dto/rating-body.dto'

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly ratingService: ChatRatingService,
  ) {}

  private sanitizeAndGuard(messages: ChatBodyDto['messages'], ip: string): ChatMessage[] {
    return messages.map(m => {
      const content = sanitizeContent(m.content)
      const matched = INJECTION_PATTERNS.find(p => p.test(content))
      if (matched) {
        this.logger.warn(
          `Injection denemesi engellendi (ip: ${ip}, rol: ${m.role}, desen: ${matched}): "${content.slice(0, 120)}"`,
        )
        throw new BadRequestException('Geçersiz mesaj içeriği')
      }
      return { role: m.role, content }
    })
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async chat(@Body() dto: ChatBodyDto, @Ip() ip: string) {
    if (dto.messages[0]?.role !== 'user')
      throw new BadRequestException('İlk mesaj kullanıcıdan olmalı')

    const reply = await this.chatService.chat(this.sanitizeAndGuard(dto.messages, ip))
    return { reply }
  }

  @Post('summary')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async summary(@Body() dto: SummaryBodyDto, @Ip() ip: string) {
    const text = await this.chatService.generateSummary(this.sanitizeAndGuard(dto.messages, ip))
    return { text }
  }

  @Post('rating')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async rate(@Body() dto: RatingBodyDto) {
    const conversation = (dto.messages ?? []).map(m => ({
      role: m.role,
      content: sanitizeContent(m.content),
    }))
    await this.ratingService.create(dto.rating, conversation)
    return { ok: true }
  }

  @UseGuards(JwtAuthGuard)
  @Get('rating/admin/all')
  adminRatings() {
    return this.ratingService.findAllWithStats()
  }
}
