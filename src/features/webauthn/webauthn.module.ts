import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebauthnService } from './webauthn.service';
import { User } from '../../entity/user.entity';
import { Authenticator } from '../../entity/authenticator.entity';
// ... 其他必要的导入

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Authenticator]),
  ],
  providers: [WebauthnService],
  exports: [WebauthnService]
})
export class WebauthnModule {}
