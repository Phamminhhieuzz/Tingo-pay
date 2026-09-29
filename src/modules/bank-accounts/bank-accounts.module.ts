import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccount } from '../../entities/bank-account.entity';
import { Shop } from '../../entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, Shop])],
  providers: [BankAccountsService],
  controllers: [BankAccountsController],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}
