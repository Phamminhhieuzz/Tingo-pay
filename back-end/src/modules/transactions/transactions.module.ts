import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../../entities/transaction.entity';
import { Shop } from '../../entities/shop.entity';
import { Device } from '../../entities/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Shop, Device])],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
