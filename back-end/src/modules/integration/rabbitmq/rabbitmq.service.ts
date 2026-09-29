import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: amqp.ChannelWrapper;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('RABBITMQ_URL') || 'amqp://user:password@localhost:5672';
    this.connection = amqp.connect([url]);
    this.channelWrapper = this.connection.createChannel({
      setup: (channel) => {
        return Promise.all([
          channel.assertExchange('tingo_events', 'topic', { durable: true }),
        ]);
      },
    });
  }

  async emit(routingKey: string, data: any) {
    await this.channelWrapper.publish('tingo_events', routingKey, Buffer.from(JSON.stringify(data)));
  }
}
