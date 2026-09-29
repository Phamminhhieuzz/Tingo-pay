import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DeviceIssuesService } from './device-issues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { DeviceIssueStatus } from '../../entities/device-issue.entity';

// Hàng đợi báo lỗi thiết bị cho nhân viên Tingo — xem/xử lý ở mọi thiết bị, không cần biết trước deviceId
// (khác với route lồng devices/:deviceId/issues chỉ xem theo 1 thiết bị).
@Controller('device-issues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceIssueQueueController {
  constructor(private readonly deviceIssuesService: DeviceIssuesService) {}

  @Get()
  @Roles(UserRole.STAFF)
  async findAll(@Query('status') status?: DeviceIssueStatus) {
    return this.deviceIssuesService.findAllForStaff(status);
  }

  @Put(':issueId/status')
  @Roles(UserRole.STAFF)
  async updateStatus(@Param('issueId') issueId: string, @Body('status') status: DeviceIssueStatus) {
    return this.deviceIssuesService.updateStatus(issueId, status);
  }
}
