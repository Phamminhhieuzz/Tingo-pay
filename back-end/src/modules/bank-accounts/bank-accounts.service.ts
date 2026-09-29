import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount, BankAccountStatus } from '../../entities/bank-account.entity';
import { Shop } from '../../entities/shop.entity';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountsRepository: Repository<BankAccount>,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
  ) {}

  async findAll(shopId?: string, userId?: string): Promise<BankAccount[]> {
    const where: any = {};
    if (shopId) where.shop = { id: shopId };
    if (userId) where.createdBy = userId;
    
    return this.bankAccountsRepository.find({
      where,
      relations: ['shop'],
    });
  }

  async findOne(id: string): Promise<BankAccount> {
    const account = await this.bankAccountsRepository.findOne({
      where: { id },
      relations: ['shop'],
    });
    if (!account) {
      throw new NotFoundException(`Bank account with ID ${id} not found`);
    }
    return account;
  }

  async create(accountData: Partial<BankAccount>, userId?: string): Promise<BankAccount> {
    const account = this.bankAccountsRepository.create({
      ...accountData,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.bankAccountsRepository.save(account);
  }

  async linkToShop(accountId: string, shopId: string): Promise<BankAccount> {
    const account = await this.findOne(accountId);
    const shop = await this.shopsRepository.findOne({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    
    account.shop = shop;
    account.status = BankAccountStatus.LINKED;
    return this.bankAccountsRepository.save(account);
  }

  async remove(id: string): Promise<void> {
    await this.bankAccountsRepository.delete(id);
  }
}
