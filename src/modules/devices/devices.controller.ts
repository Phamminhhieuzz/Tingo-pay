import { Controller, Get, Post, Body, Param, Delete, UseGuards, Put, Query } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { DeviceOpStatus } from '../../entities/device.entity';

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findAll(@Query('shopId') shopId?: string) {
    return this.devicesService.findAll(shopId);
  }

  @Get(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SHOP_OWNER)
  async create(@Body() deviceData: { serial: string; model: string }) {
    return this.devicesService.create(deviceData);
  }

  @Put(':id/link/:shopId')
  @Roles(UserRole.SHOP_OWNER)
  async linkToShop(@Param('id') id: string, @Param('shopId') shopId: string) {
    return this.devicesService.linkToShop(id, shopId);
  }

  @Post(':id/bind')
  @Roles(UserRole.SHOP_OWNER)
  async bindToShop(@Param('id') id: string, @Body('shopId') shopId: string) {
    return this.devicesService.bindToShop(id, shopId);
  }

  // Huỷ liên kết loa: gỡ khỏi cửa hàng nhưng vẫn giữ bản ghi thiết bị (khác remove() bên dưới)
  @Put(':id/unlink')
  @Roles(UserRole.SHOP_OWNER)
  async unlink(@Param('id') id: string) {
    return this.devicesService.unlinkFromShop(id);
  }

  @Put(':id/status')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async updateStatus(@Param('id') id: string, @Body('status') status: DeviceOpStatus) {
    return this.devicesService.updateOpStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SHOP_OWNER)
  async remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
