import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from '../../entities/shop.entity';
import { ShopStaff } from '../../entities/shop-staff.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, Shop, ShopStaff]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        // Không có khoá dự phòng: JwtStrategy đã chặn khởi động khi thiếu JWT_SECRET, giữ đồng bộ ở đây
        if (!secret) throw new Error('JWT_SECRET chưa được cấu hình');
        return {
          secret,
          signOptions: {
            expiresIn: (configService.get<string>('JWT_EXPIRATION') || '3600s') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
