import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ChatService, INJECTION_PATTERNS, sanitizeContent } from './chat.service'
import { ChatBodyDto, SummaryBodyDto } from './dto/chat-body.dto'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async chat(@Body() dto: ChatBodyDto) {
    if (dto.messages[0]?.role !== 'user')
      throw new BadRequestException('İlk mesaj kullanıcıdan olmalı')

    const clean = dto.messages.map(m => {
      const content = sanitizeContent(m.content)
      if (INJECTION_PATTERNS.some(p => p.test(content)))
        throw new BadRequestException('Geçersiz mesaj içeriği')
      return { role: m.role, content }
    })

    const reply = await this.chatService.chat(clean)
    return { reply }
  }

  @Post('summary')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async summary(@Body() dto: SummaryBodyDto) {
    const clean = dto.messages.map(m => {
      const content = sanitizeContent(m.content)
      if (INJECTION_PATTERNS.some(p => p.test(content)))
        throw new BadRequestException('Geçersiz mesaj içeriği')
      return { role: m.role, content }
    })

    const text = await this.chatService.generateSummary(clean)
    return { text }
  }
}
