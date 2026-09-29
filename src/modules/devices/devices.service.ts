import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceLinkStatus, DeviceOpStatus } from '../../entities/device.entity';
import { Shop } from '../../entities/shop.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
  ) {}

  async findAll(shopId?: string): Promise<Device[]> {
    if (shopId) {
      return this.devicesRepository.find({
        where: { shop: { id: shopId } },
        relations: ['shop'],
      });
    }
    return this.devicesRepository.find({ relations: ['shop'] });
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { id },
      relations: ['shop'],
    });
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }

  async create(deviceData: { serial: string; model: string }): Promise<Device> {
    const device = this.devicesRepository.create({
      ...deviceData,
      code: `DEV_${deviceData.serial}`,
      name: `Device ${deviceData.model}`,
      linkStatus: DeviceLinkStatus.UNLINKED,
      opStatus: DeviceOpStatus.OFFLINE,
    });
    return this.devicesRepository.save(device);
  }

  async linkToShop(deviceId: string, shopId: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    const shop = await this.shopsRepository.findOne({ where: { id: shopId } });
    if (!shop) throw new NotFoundException('Shop not found');
    
    device.shop = shop;
    device.linkStatus = DeviceLinkStatus.LINKED;
    return this.devicesRepository.save(device);
  }

  async bindToShop(deviceId: string, shopId: string): Promise<Device> {
    return this.linkToShop(deviceId, shopId);
  }

  // Huỷ liên kết loa khỏi cửa hàng: gỡ shop và đưa về UNLINKED, KHÔNG xoá thiết bị
  // (khác với remove() bên dưới, vốn xoá hẳn bản ghi thiết bị)
  async unlinkFromShop(deviceId: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    device.shop = null as any;
    device.linkStatus = DeviceLinkStatus.UNLINKED;
    return this.devicesRepository.save(device);
  }

  async updateOpStatus(deviceId: string, status: DeviceOpStatus): Promise<Device> {
    const device = await this.findOne(deviceId);
    device.opStatus = status;
    return this.devicesRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    await this.devicesRepository.delete(id);
  }
}
