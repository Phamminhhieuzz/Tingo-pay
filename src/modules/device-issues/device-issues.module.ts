import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceIssuesService } from './device-issues.service';
import { DeviceIssuesController } from './device-issues.controller';
import { DeviceIssueQueueController } from './device-issue-queue.controller';
import { DeviceIssuePhotoService } from './device-issue-photo.service';
import { DeviceIssue } from '../../entities/device-issue.entity';
import { Device } from '../../entities/device.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceIssue, Device]), StorageModule],
  providers: [DeviceIssuesService, DeviceIssuePhotoService],
  controllers: [DeviceIssuesController, DeviceIssueQueueController],
})
export class DeviceIssuesModule {}
