import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppSetting } from './app-setting.entity'
import { InstagramTokenService } from './instagram-token.service'
import { EncryptionService } from '../common/encryption.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AppSetting])],
  providers: [InstagramTokenService, EncryptionService],
  exports: [InstagramTokenService],
})
export class InstagramTokenModule {}
