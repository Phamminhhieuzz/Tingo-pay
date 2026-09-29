import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  VibService,
  type VibContractListBody,
  type VibProxyBody,
} from './vib.service';

/**
 * VIB BFF — contract list + balance-change register/unregister.
 * Zalo Mini App calls whitelisted gateway; gateway proxies to Core V2.
 */
@Controller('api/vib')
export class VibController {
  constructor(private readonly vibService: VibService) {}

  @Post('contract/list')
  @HttpCode(HttpStatus.OK)
  async listContracts(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VibContractListBody,
  ) {
    return this.vibService.fetchContractList(authorization, body ?? {});
  }

  @Post('balance-change/register/init')
  @HttpCode(HttpStatus.OK)
  async registerInit(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VibProxyBody,
  ) {
    return this.vibService.registerInit(authorization, body ?? {});
  }

  @Post('balance-change/register/confirm')
  @HttpCode(HttpStatus.OK)
  async registerConfirm(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VibProxyBody,
  ) {
    return this.vibService.registerConfirm(authorization, body ?? {});
  }

  @Post('balance-change/unregister/init')
  @HttpCode(HttpStatus.OK)
  async unregisterInit(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VibProxyBody,
  ) {
    return this.vibService.unregisterInit(authorization, body ?? {});
  }

  @Post('balance-change/unregister/confirm')
  @HttpCode(HttpStatus.OK)
  async unregisterConfirm(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: VibProxyBody,
  ) {
    return this.vibService.unregisterConfirm(authorization, body ?? {});
  }
}
