import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ZaloAccountLinkService } from './zalo-account-link.service';
import {
  LinkZaloAccountDto,
  UnlinkZaloAccountDto,
} from './dto/link-zalo-account.dto';
import { TingoAuthService } from '../tingo-auth/tingo-auth.service';

/**
 * Quản lý liên kết Zalo userId ↔ Tingo Pay account (qrcert).
 *
 * - POST   /api/zalo/account-link          — liên kết (sau login SĐT + mật khẩu)
 * - DELETE /api/zalo/account-link          — hủy liên kết (user)
 * - GET    /api/zalo/account-link/status   — ?zaloUserId= | ?tingoUserId=
 */
@Controller('api/zalo/account-link')
export class ZaloAccountLinkController {
  constructor(
    private readonly zaloAccountLinkService: ZaloAccountLinkService,
    private readonly tingoAuthService: TingoAuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async link(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: LinkZaloAccountDto,
  ) {
    const account = await this.tingoAuthService.verifyV1Session(authorization);
    const link = await this.zaloAccountLinkService.link({
      ...body,
      tingoUserId: account.userId,
      tingoPhone: account.phoneNo,
    });
    return { status: 200, message: 'OK', data: link };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async unlink(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: UnlinkZaloAccountDto,
  ) {
    const account = await this.tingoAuthService.verifyV1Session(authorization);
    const link = await this.zaloAccountLinkService.unlink({
      ...body,
      tingoUserId: account.userId,
    });
    return { status: 200, message: 'OK', data: link };
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  async status(
    @Headers('authorization') authorization: string | undefined,
    @Query('zaloUserId') zaloUserId?: string,
  ) {
    const account = await this.tingoAuthService.verifyV1Session(authorization);
    const result = await this.zaloAccountLinkService.getStatus({
      zaloUserId,
      tingoUserId: account.userId,
    });
    return { status: 200, message: 'OK', data: result };
  }

  @Get('status-public')
  @HttpCode(HttpStatus.OK)
  async statusPublic(@Query('zaloUserId') zaloUserId?: string) {
    const result =
      await this.zaloAccountLinkService.getStatusByZaloUserId(zaloUserId);
    return { status: 200, message: 'OK', data: result };
  }
}
