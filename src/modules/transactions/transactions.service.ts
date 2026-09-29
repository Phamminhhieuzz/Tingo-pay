import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, RefundStatus } from '../../entities/transaction.entity';
import { Shop } from '../../entities/shop.entity';
import { Device } from '../../entities/device.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async findAll(filters: { shopId?: string; deviceId?: string; page?: any; limit?: any }): Promise<{ data: Transaction[]; total: number }> {
    const p = parseInt(filters.page, 10) || 1;
    const l = parseInt(filters.limit, 10) || 10;
    const take = Math.min(l, 25);
    const skip = (p - 1) * take;

    const where: any = {};
    if (filters.shopId) where.shop = { id: filters.shopId };
    if (filters.deviceId) where.device = { id: filters.deviceId };

    const [data, total] = await this.transactionsRepository.findAndCount({
      where,
      relations: ['shop', 'device'],
      order: { time: 'DESC' },
      take,
      skip,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['shop', 'device'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionsRepository.create(transactionData);
    return this.transactionsRepository.save(transaction);
  }

  async updateStatus(id: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.status = status;
    return this.transactionsRepository.save(transaction);
  }

  async updateRefundStatus(id: string, status: RefundStatus): Promise<Transaction> {
    const transaction = await this.findOne(id);
    transaction.refundStatus = status;
    return this.transactionsRepository.save(transaction);
  }
}
