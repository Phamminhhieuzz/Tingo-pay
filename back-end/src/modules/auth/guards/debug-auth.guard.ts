import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Chỉ mở các endpoint đăng nhập/đăng ký bằng số điện thoại trần (không xác thực) khi
 * ENABLE_DEBUG_AUTH=true. Production không đặt biến này nên các endpoint trả 404 như không tồn tại.
 */
@Injectable()
export class DebugAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.configService.get<string>('ENABLE_DEBUG_AUTH') !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
