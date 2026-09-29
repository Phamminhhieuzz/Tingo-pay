import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { Shop } from '../../entities/shop.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/transaction.entity';
import { ShopStaff } from '../../entities/shop-staff.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, User, Transaction, ShopStaff]), AuthModule, UsersModule],
  providers: [ShopsService],
  controllers: [ShopsController],
  exports: [ShopsService],
})
export class ShopsModule {}
