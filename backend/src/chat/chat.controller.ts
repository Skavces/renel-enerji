import { BadRequestException, Body, Controller, Get, Ip, Logger, Post, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ChatMessage, ChatService, INJECTION_PATTERNS, sanitizeContent } from './chat.service'
import { ChatRatingService } from './chat-rating.service'
import { ChatLeadService } from './chat-lead.service'
import { ChatBodyDto, SummaryBodyDto } from './dto/chat-body.dto'
import { RatingBodyDto } from './dto/rating-body.dto'

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name)

  constructor(
    private readonly chatService: ChatService,
    private readonly ratingService: ChatRatingService,
    private readonly leadService: ChatLeadService,
  ) {}

  // Lead takibi asıl akışı asla bozmamalı; hatalar loglanıp yutulur
  private trackLead(promise: Promise<void>): void {
    promise.catch(err =>
      this.logger.warn(`Lead kaydı başarısız: ${err instanceof Error ? err.message : err}`),
    )
  }

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

    const sanitized = this.sanitizeAndGuard(dto.messages, ip)
    const reply = await this.chatService.chat(sanitized)
    this.trackLead(this.leadService.upsertFromChat(dto.sessionId, sanitized, reply))
    return { reply }
  }

  @Post('summary')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async summary(@Body() dto: SummaryBodyDto, @Ip() ip: string) {
    const text = await this.chatService.generateSummary(this.sanitizeAndGuard(dto.messages, ip))
    this.trackLead(this.leadService.markWhatsapp(dto.sessionId))
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
    this.trackLead(this.leadService.attachRating(dto.sessionId, dto.rating))
    return { ok: true }
  }

  @UseGuards(JwtAuthGuard)
  @Get('rating/admin/all')
  adminRatings() {
    return this.ratingService.findAllWithStats()
  }

  @UseGuards(JwtAuthGuard)
  @Get('lead/admin/all')
  adminLeads() {
    return this.leadService.findAllWithStats()
  }
}
