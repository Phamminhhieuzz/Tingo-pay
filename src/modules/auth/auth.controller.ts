import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../../entities/user.entity';
import { DebugAuthGuard } from './guards/debug-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Chỉ dùng khi dev: không xác thực người gọi, bị chặn trên production (xem DebugAuthGuard)
  @UseGuards(DebugAuthGuard)
  @Post('register')
  async register(@Body() registrationData: { fullName: string; phoneZalo: string; role?: UserRole }) {
    return this.authService.register(registrationData);
  }

  // Chỉ dùng khi dev: đăng nhập chỉ bằng số điện thoại, bị chặn trên production (xem DebugAuthGuard)
  @UseGuards(DebugAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginData: { phoneZalo: string }) {
    // In a real app, we would verify the Zalo token/session here.
    // For now, we'll just allow login by phone number for testing.
    const user = await this.authService.validateUser(loginData.phoneZalo);
    if (!user) {
      // For simplicity, if user doesn't exist, we could auto-register or throw.
      // Here we throw.
      throw new UnauthorizedException('User not found or inactive');
    }
    return this.authService.login(user);
  }

  @Post('zalo')
  @HttpCode(HttpStatus.OK)
  async loginWithZalo(
    @Body() zaloData: { accessToken: string; tokenSĐT: string; role: UserRole },
  ) {
    return this.authService.loginWithZalo(zaloData);
  }

  // Chỉ exchange số điện thoại (không login, không tạo user)
  @Post('zalo/exchange-phone')
  @HttpCode(HttpStatus.OK)
  async exchangePhone(@Body() zaloData: { accessToken: string; tokenSĐT: string }) {
    return this.authService.exchangeZaloPhone(zaloData);
  }
}
