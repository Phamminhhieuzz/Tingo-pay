import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DeviceIssuesService } from './device-issues.service';
import { DeviceIssuePhotoService } from './device-issue-photo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { DeviceIssueStatus } from '../../entities/device-issue.entity';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Controller('devices/:deviceId/issues')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceIssuesController {
  constructor(
    private readonly deviceIssuesService: DeviceIssuesService,
    private readonly photoService: DeviceIssuePhotoService,
  ) {}

  @Get()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  async findAll(@Param('deviceId') deviceId: string) {
    return this.deviceIssuesService.findAllByDevice(deviceId);
  }

  // multipart/form-data: field "description" (text) + field "photo" (file, tuỳ chọn)
  @Post()
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF, UserRole.SHOP_MEMBER)
  @UseInterceptors(
    FileInterceptor('photo', {
      // Giữ file trong bộ nhớ (không ghi đĩa) để upload thẳng lên Supabase Storage; DeviceIssuePhotoService
      // tự lưu tạm ra đĩa làm phương án dự phòng khi chưa cấu hình Supabase (xem file đó).
      storage: memoryStorage(),
      limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async create(
    @Param('deviceId') deviceId: string,
    @Body('description') description: string,
    @Request() req,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!description || !description.trim()) {
      throw new BadRequestException('Vui lòng nhập mô tả lỗi');
    }
    const photoUrl = photo ? await this.photoService.save(photo) : undefined;
    return this.deviceIssuesService.create(deviceId, req.user, description.trim(), photoUrl);
  }

  @Put(':issueId/status')
  @Roles(UserRole.SHOP_OWNER, UserRole.STAFF)
  async updateStatus(
    @Param('issueId') issueId: string,
    @Body('status') status: DeviceIssueStatus,
  ) {
    return this.deviceIssuesService.updateStatus(issueId, status);
  }
}
