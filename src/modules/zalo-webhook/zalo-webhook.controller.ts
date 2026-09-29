import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZaloWebhookService } from './zalo-webhook.service';
import type { ZaloConsentRevokePayload } from '../../utils/zalo-webhook-signature';

/**
 * Zalo Mini App webhook — consent revoke / data deletion callback.
 * Console URL: POST https://tingo-api-gateway.vietqr.vn/api/zalo/webhook/consent-revoke
 */
@Controller('api/zalo/webhook')
export class ZaloWebhookController {
  constructor(private readonly zaloWebhookService: ZaloWebhookService) {}

  @Post('consent-revoke')
  @HttpCode(HttpStatus.OK)
  async consentRevoke(
    @Body() body: ZaloConsentRevokePayload,
    @Headers('x-zevent-signature') signature?: string,
  ) {
    return this.zaloWebhookService.handleConsentRevoke(body, signature);
  }
}
