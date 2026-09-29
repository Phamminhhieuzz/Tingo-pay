import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { PaymentQrService } from './payment-qr.service';
import { PaymentsService } from './payments.service';
import { VietQrClient } from './vietqr-client';
import { VietQrCallbackAuthService } from './vietqr-callback-auth.service';
import { VietQrCallbackController } from './vietqr-callback.controller';
import { DebugPaymentGuard } from './debug-payment.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), JwtModule.register({})],
  providers: [VietQrClient, PaymentQrService, PaymentsService, VietQrCallbackAuthService, DebugPaymentGuard],
  controllers: [VietQrCallbackController],
  exports: [PaymentQrService, DebugPaymentGuard],
})
export class PaymentsModule {}
