import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { CreateOrderInput } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { OrderStatus } from '../../entities/order.entity';
import { DebugPaymentGuard } from '../payments/debug-payment.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER, UserRole.CUSTOMER)
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(req.user, page, limit, status);
  }

  @Get(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER, UserRole.CUSTOMER)
  async findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOneFor(id, req.user);
  }

  @Post()
  @Roles(UserRole.SHOP_OWNER, UserRole.CUSTOMER)
  async create(@Body() body: CreateOrderInput, @Request() req) {
    return this.ordersService.create(body, req.user);
  }

  // Chỉ nhân viên Tingo đẩy đơn qua các bước xử lý/giao hàng (người mua không có quyền này)
  @Put(':id/status')
  @Roles(UserRole.STAFF)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; trackingNumber?: string; shippingProvider?: string },
  ) {
    return this.ordersService.advance(id, body.status, {
      trackingNumber: body.trackingNumber,
      shippingProvider: body.shippingProvider,
    });
  }

  @Put(':id/confirm-received')
  @Roles(UserRole.SHOP_OWNER, UserRole.CUSTOMER)
  async confirmReceived(@Param('id') id: string, @Request() req) {
    return this.ordersService.confirmReceived(id, req.user);
  }

  @Delete(':id/cancel')
  @Roles(UserRole.SHOP_OWNER, UserRole.CUSTOMER)
  async cancel(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancel(id, req.user);
  }

  // Nhân viên xác nhận đã nhận tiền: thu COD sau khi giao, hoặc đơn chuyển khoản khi callback không tới
  @Put(':id/payment-received')
  @Roles(UserRole.STAFF)
  async markPaymentReceived(@Param('id') id: string, @Request() req) {
    return this.ordersService.markPaidByStaff(id, req.user.id);
  }

  // Chỉ để dev: giả lập VietQR báo tiền vào (404 khi ENABLE_DEBUG_PAYMENT không bật)
  @Post(':id/dev-mark-paid')
  @UseGuards(DebugPaymentGuard)
  @Roles(UserRole.SHOP_OWNER, UserRole.CUSTOMER, UserRole.STAFF)
  async devMarkPaid(@Param('id') id: string, @Request() req) {
    return this.ordersService.devMarkPaid(id, req.user);
  }
}
