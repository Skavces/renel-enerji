import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ChatMessage, ChatService } from './chat.service'

interface ChatBody {
  messages: ChatMessage[]
}

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async chat(@Body() body: ChatBody) {
    if (!Array.isArray(body?.messages) || body.messages.length === 0)
      throw new BadRequestException('Mesajlar eksik')

    if (body.messages.length > 20)
      throw new BadRequestException('Çok fazla mesaj')

    const clean = body.messages.map(m => {
      if (m.role !== 'user' && m.role !== 'assistant')
        throw new BadRequestException('Geçersiz mesaj rolü')
      if (typeof m.content !== 'string' || m.content.length > 1000)
        throw new BadRequestException('Geçersiz mesaj içeriği')
      return { role: m.role, content: m.content.trim() }
    })

    const reply = await this.chatService.chat(clean)
    return { reply }
  }
}
