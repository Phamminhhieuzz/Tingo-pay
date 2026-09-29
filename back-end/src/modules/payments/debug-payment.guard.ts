import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Endpoint giả lập "VietQR báo tiền vào" chỉ mở khi ENABLE_DEBUG_PAYMENT=true; production không đặt biến này nên trả 404.
@Injectable()
export class DebugPaymentGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.configService.get<string>('ENABLE_DEBUG_PAYMENT') !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
