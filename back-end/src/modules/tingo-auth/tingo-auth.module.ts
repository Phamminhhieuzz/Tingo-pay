import { Module } from '@nestjs/common';
import { TingoAuthController } from './tingo-auth.controller';
import { TingoAuthService } from './tingo-auth.service';

@Module({
  controllers: [TingoAuthController],
  providers: [TingoAuthService],
  exports: [TingoAuthService],
})
export class TingoAuthModule {}
