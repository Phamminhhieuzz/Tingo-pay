import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Put, Query, NotFoundException } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ShopRole } from '../../entities/shop-staff.entity';

@Controller('shops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShopsController {
  constructor(
    private readonly shopsService: ShopsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // Tra cứu người dùng theo SĐT để Chủ cửa hàng thêm làm nhân viên (cần biết userId trước
  // khi gọi PUT /shops/:id/staff/:userId). Chỉ trả thông tin tối thiểu, không lộ dữ liệu nhạy cảm.
  @Get('staff/lookup')
  @Roles(UserRole.SHOP_OWNER)
  async lookupUserByPhone(@Query('phone') phone: string) {
    const user = await this.usersService.findOneByPhone(phone);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với số điện thoại này');
    }
    return { id: user.id, fullName: user.fullName, phoneZalo: user.phoneZalo };
  }

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER, UserRole.GUEST)
  async findAll(@Request() req) {
    if (req.user.role === UserRole.SHOP_OWNER) {
      return this.shopsService.findAll(req.user.id);
    }
    // Staff might only see shops they are assigned to.
    // For now, owners see their shops.
    return this.shopsService.findAll();
  }

  @Get('dashboard')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async getDashboard(@Request() req, @Query('search') search?: string) {
    if (req.user.role === UserRole.SHOP_OWNER) {
      return this.shopsService.getDashboard(req.user.id, search);
    }
    // For staff, maybe we don't return all shops' overview or filter by their allocated shops.
    // For simplicity right now, returning their allocated shops.
    return this.shopsService.getDashboard(undefined, search);
  }

  @Get(':id')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER, UserRole.GUEST)
  async findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  // Cho phép cả CUSTOMER gọi: đây chính là cách một người dùng thường trở thành
  // Chủ cửa hàng lần đầu (tạo cửa hàng đầu tiên -> service tự nâng vai trò lên SHOP_OWNER).
  // Chỉ chặn SHOP_OWNER/CUSTOMER vì STAFF/SHOP_MEMBER/GUEST không được tự tạo cửa hàng.
  @Post()
  @Roles(UserRole.SHOP_OWNER, UserRole.CUSTOMER)
  async create(@Body() shopData: any, @Request() req) {
    const shop = await this.shopsService.create(shopData, req.user);
    // Vai trò trong token cũ (req.user.role) có thể vẫn là CUSTOMER dù DB đã cập nhật
    // SHOP_OWNER ở service.create() phía trên -> cấp lại token mới đúng vai trò ngay,
    // để frontend không phải bắt người dùng đăng nhập lại mới dùng được các API SHOP_OWNER.
    const { access_token, user } = await this.authService.login(req.user, UserRole.SHOP_OWNER);
    return { shop, access_token, user };
  }

  @Put(':id')
  @Roles(UserRole.SHOP_OWNER)
  async update(@Param('id') id: string, @Body() shopData: any) {
    return this.shopsService.update(id, shopData);
  }

  @Put(':id/staff/:userId')
  @Roles(UserRole.SHOP_OWNER)
  async addStaff(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body('role') role: ShopRole,
  ) {
    return this.shopsService.addStaff(id, userId, role);
  }

  @Delete(':id/staff/:userId')
  @Roles(UserRole.SHOP_OWNER)
  async removeStaff(@Param('id') id: string, @Param('userId') userId: string) {
    return this.shopsService.removeStaff(id, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SHOP_OWNER)
  async remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async getStats(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: 'day' | 'week' | 'month',
  ) {
    return this.shopsService.getStats(id, startDate, endDate, interval);
  }

  @Get(':id/export')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async exportTransactions(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shopsService.exportTransactions(id, startDate, endDate);
  }
}
