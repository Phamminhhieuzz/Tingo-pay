import { Module } from '@nestjs/common';
import { PayboxController } from './paybox.controller';
import { PayboxService } from './paybox.service';

@Module({
  controllers: [PayboxController],
  providers: [PayboxService],
})
export class PayboxModule {}
