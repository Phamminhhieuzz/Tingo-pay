import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    // Không có khoá dự phòng: thiếu JWT_SECRET là lỗi cấu hình phải sửa trước khi chạy, không được
    // âm thầm dùng khoá đoán được khiến ai cũng giả mạo được token (kể cả token vai trò STAFF).
    if (!secret) {
      throw new Error('JWT_SECRET chưa được cấu hình');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // Attach the specific role from the JWT payload to the user object
    return { ...user, role: payload.role };
  }
}
