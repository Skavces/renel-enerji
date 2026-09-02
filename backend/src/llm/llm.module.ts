import { Global, Module } from '@nestjs/common'
import { LlmService } from './llm.service'
import { LlmHealthService } from './llm-health.service'

@Global()
@Module({
  providers: [LlmService, LlmHealthService],
  exports: [LlmService],
})
export class LlmModule {}
