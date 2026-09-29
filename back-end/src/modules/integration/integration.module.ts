import { Module } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';

@Module({
  providers: [RedisService, RabbitmqService],
  exports: [RedisService, RabbitmqService],
})
export class IntegrationModule {}
