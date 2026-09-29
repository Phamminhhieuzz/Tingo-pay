import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceIssue, DeviceIssueStatus } from '../../entities/device-issue.entity';
import { Device } from '../../entities/device.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class DeviceIssuesService {
  constructor(
    @InjectRepository(DeviceIssue)
    private deviceIssuesRepository: Repository<DeviceIssue>,
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async findAllByDevice(deviceId: string): Promise<DeviceIssue[]> {
    return this.deviceIssuesRepository.find({
      where: { device: { id: deviceId } },
      order: { createdAt: 'DESC' },
    });
  }

  // Dành cho nhân viên Tingo: xem toàn bộ báo lỗi ở mọi thiết bị, kèm thông tin thiết bị + người báo
  async findAllForStaff(status?: DeviceIssueStatus): Promise<DeviceIssue[]> {
    return this.deviceIssuesRepository.find({
      ...(status ? { where: { status } } : {}),
      relations: ['device', 'reportedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    deviceId: string,
    reporter: User,
    description: string,
    photoUrl?: string,
  ): Promise<DeviceIssue> {
    const device = await this.devicesRepository.findOne({ where: { id: deviceId } });
    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} not found`);
    }

    const issue = this.deviceIssuesRepository.create({
      device,
      reportedBy: reporter,
      description,
      photoUrl,
      status: DeviceIssueStatus.OPEN,
    });
    return this.deviceIssuesRepository.save(issue);
  }

  async updateStatus(issueId: string, status: DeviceIssueStatus): Promise<DeviceIssue> {
    const issue = await this.deviceIssuesRepository.findOne({ where: { id: issueId } });
    if (!issue) {
      throw new NotFoundException(`Device issue with ID ${issueId} not found`);
    }
    issue.status = status;
    return this.deviceIssuesRepository.save(issue);
  }
}
