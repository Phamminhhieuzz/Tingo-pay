import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { TransactionStatus, RefundStatus } from '../../entities/transaction.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findAll(
    @Query('shopId') shopId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.transactionsService.findAll({ shopId, deviceId, page, limit });
  }

  @Get(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SHOP_OWNER)
  async create(@Body() transactionData: any) {
    return this.transactionsService.create(transactionData);
  }

  @Put(':id/status')
  @Roles(UserRole.SHOP_OWNER)
  async updateStatus(@Param('id') id: string, @Body('status') status: TransactionStatus) {
    return this.transactionsService.updateStatus(id, status);
  }

  @Put(':id/refund')
  @Roles(UserRole.SHOP_OWNER)
  async updateRefundStatus(@Param('id') id: string, @Body('status') status: RefundStatus) {
    return this.transactionsService.updateRefundStatus(id, status);
  }
}
