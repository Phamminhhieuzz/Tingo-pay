import { Module } from '@nestjs/common';
import { ZaloWebhookController } from './zalo-webhook.controller';
import { ZaloWebhookService } from './zalo-webhook.service';
import { ZaloAccountLinkModule } from '../zalo-account-link/zalo-account-link.module';

@Module({
  imports: [ZaloAccountLinkModule],
  controllers: [ZaloWebhookController],
  providers: [ZaloWebhookService],
})
export class ZaloWebhookModule {}
