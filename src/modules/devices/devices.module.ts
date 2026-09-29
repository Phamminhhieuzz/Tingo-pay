import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from '../../entities/device.entity';
import { Shop } from '../../entities/shop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Shop])],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
