import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'crypto';

const TOKEN_TTL_SECONDS = 300;
const SCOPE = 'vietqr-callback';

// So sánh chuỗi bằng băm + timingSafeEqual để không lộ độ dài/vị trí khác biệt qua thời gian phản hồi
const safeEqual = (a: string, b: string): boolean =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

// Chiều VietQR GỌI VÀO: ta phát token ngắn hạn cho VietQR (Basic Auth) rồi kiểm tra token đó ở transaction-sync.
// Token dùng khoá riêng VIETQR_CALLBACK_JWT_SECRET, khác khoá đăng nhập người dùng, và KHÔNG có khoá dự phòng.
@Injectable()
export class VietQrCallbackAuthService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
  ) {}

  private secret(): string {
    const secret = this.config.get<string>('VIETQR_CALLBACK_JWT_SECRET');
    if (!secret) throw new ServiceUnavailableException('Chưa cấu hình xác thực callback');
    return secret;
  }

  issueToken(authorization?: string): { access_token: string; token_type: 'Bearer'; expires_in: number } {
    const user = this.config.get<string>('VIETQR_CALLBACK_USER');
    const pass = this.config.get<string>('VIETQR_CALLBACK_PASS');
    const secret = this.secret();
    if (!user || !pass) throw new ServiceUnavailableException('Chưa cấu hình xác thực callback');

    const match = /^Basic\s+(.+)$/i.exec(authorization ?? '');
    const decoded = match ? Buffer.from(match[1], 'base64').toString('utf8') : '';
    const sep = decoded.indexOf(':');
    const givenUser = sep >= 0 ? decoded.slice(0, sep) : '';
    const givenPass = sep >= 0 ? decoded.slice(sep + 1) : '';
    // Tính cả hai phép so sánh trước khi kết luận để thời gian phản hồi không phụ thuộc user đúng hay sai
    const userOk = safeEqual(givenUser, user);
    const passOk = safeEqual(givenPass, pass);
    if (!match || !userOk || !passOk) throw new UnauthorizedException('Sai thông tin xác thực');

    const access_token = this.jwt.sign({ scope: SCOPE }, { secret, expiresIn: TOKEN_TTL_SECONDS });
    return { access_token, token_type: 'Bearer', expires_in: TOKEN_TTL_SECONDS };
  }

  verifyBearer(authorization?: string): void {
    const secret = this.secret();
    const match = /^Bearer\s+(.+)$/i.exec(authorization ?? '');
    if (!match) throw new UnauthorizedException('Thiếu token');
    try {
      const payload = this.jwt.verify<{ scope?: string }>(match[1], { secret });
      if (payload.scope !== SCOPE) throw new Error('scope');
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
