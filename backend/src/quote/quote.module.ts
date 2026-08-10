import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QuoteController } from './quote.controller'
import { QuoteService } from './quote.service'
import { QuoteRetentionService } from './quote-retention.service'
import { QuoteRequest } from './entities/quote-request.entity'

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest])],
  controllers: [QuoteController],
  providers: [QuoteService, QuoteRetentionService],
})
export class QuoteModule {}
