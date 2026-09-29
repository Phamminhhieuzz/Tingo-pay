import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZaloAccountLink } from '../../entities/zalo-account-link.entity';
import { ZaloAccountLinkController } from './zalo-account-link.controller';
import { ZaloAccountLinkService } from './zalo-account-link.service';
import { TingoAuthModule } from '../tingo-auth/tingo-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ZaloAccountLink]), TingoAuthModule],
  controllers: [ZaloAccountLinkController],
  providers: [ZaloAccountLinkService],
  exports: [ZaloAccountLinkService],
})
export class ZaloAccountLinkModule {}
