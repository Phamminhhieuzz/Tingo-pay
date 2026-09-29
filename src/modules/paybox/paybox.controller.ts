import { Controller, Get, Headers, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { PayboxService, type PayboxListQuery } from './paybox.service';

/**
 * Pay Box BFF — `/api/device/paybox`
 * Zalo Mini App calls this same-origin-safe endpoint; gateway proxies to Core V2.
 */
@Controller('api/device')
export class PayboxController {
  constructor(private readonly payboxService: PayboxService) {}

  @Get('paybox')
  @HttpCode(HttpStatus.OK)
  async getPayboxList(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: PayboxListQuery,
  ) {
    return this.payboxService.fetchPayboxList(authorization, query);
  }
}
