import { BadRequestException, Body, Controller, Ip, Logger, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ChatMessage, ChatService, INJECTION_PATTERNS, sanitizeContent } from './chat.service'
import { ChatBodyDto, SummaryBodyDto } from './dto/chat-body.dto'

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name)

  constructor(private readonly chatService: ChatService) {}

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
}
