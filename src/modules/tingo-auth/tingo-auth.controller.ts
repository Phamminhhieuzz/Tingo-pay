import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { TingoAuthService } from './tingo-auth.service';

@Controller('api/tingo/auth')
export class TingoAuthController {
  constructor(private readonly tingoAuthService: TingoAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { phone?: string; pin?: string }) {
    const session = await this.tingoAuthService.login(body.phone ?? '', body.pin ?? '');
    return { status: 200, message: 'OK', data: session };
  }

  @Get('phone-status')
  @HttpCode(HttpStatus.OK)
  async phoneStatus(@Query('phone') phone?: string) {
    const exists = await this.tingoAuthService.phoneExists(phone ?? '');
    return { status: 200, message: 'OK', data: { exists } };
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: { phone?: string; pin?: string }) {
    const session = await this.tingoAuthService.register(body.phone ?? '', body.pin ?? '');
    return { status: 200, message: 'OK', data: session };
  }
}
