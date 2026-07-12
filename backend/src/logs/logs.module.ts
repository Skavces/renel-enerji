import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppLog } from './entities/app-log.entity'
import { LogsService } from './logs.service'
import { DbLogger } from './db-logger.service'
import { LogsController } from './logs.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AppLog])],
  controllers: [LogsController],
  providers: [LogsService, DbLogger],
  exports: [LogsService, DbLogger],
})
export class LogsModule {}
