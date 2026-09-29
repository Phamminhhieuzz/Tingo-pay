import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShopsModule } from './modules/shops/shops.module';
import { DevicesModule } from './modules/devices/devices.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ProductsModule } from './modules/products/products.module';
import { PayboxModule } from './modules/paybox/paybox.module';
import { VibModule } from './modules/vib/vib.module';
import { ZaloWebhookModule } from './modules/zalo-webhook/zalo-webhook.module';
import { ZaloAccountLinkModule } from './modules/zalo-account-link/zalo-account-link.module';
import { TingoAuthModule } from './modules/tingo-auth/tingo-auth.module';
import { DeviceIssuesModule } from './modules/device-issues/device-issues.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Giới hạn tần suất gọi API chung — chặn dò mật khẩu/OTP hàng loạt vào /auth
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // Use false in production
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ShopsModule,
    DevicesModule,
    DeviceIssuesModule,
    BankAccountsModule,
    OrdersModule,
    PaymentsModule,
    TransactionsModule,
    IntegrationModule,
    ProductsModule,
    PayboxModule,
    VibModule,
    TingoAuthModule,
    ZaloAccountLinkModule,
    ZaloWebhookModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
