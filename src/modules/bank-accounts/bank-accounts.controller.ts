import { Controller, Get, Post, Body, Param, Delete, UseGuards, Put, Query, Request } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findAll(@Request() req, @Query('shopId') shopId?: string) {
    return this.bankAccountsService.findAll(shopId, req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findOne(@Param('id') id: string) {
    return this.bankAccountsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SHOP_OWNER)
  async create(@Body() accountData: any, @Request() req) {
    return this.bankAccountsService.create(accountData, req.user.id);
  }

  @Put(':id/link/:shopId')
  @Roles(UserRole.SHOP_OWNER)
  async linkToShop(@Param('id') id: string, @Param('shopId') shopId: string) {
    return this.bankAccountsService.linkToShop(id, shopId);
  }

  @Delete(':id')
  @Roles(UserRole.SHOP_OWNER)
  async remove(@Param('id') id: string) {
    return this.bankAccountsService.remove(id);
  }
}
