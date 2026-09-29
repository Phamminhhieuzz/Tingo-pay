import { Module } from '@nestjs/common';
import { VibController } from './vib.controller';
import { VibService } from './vib.service';

@Module({
  controllers: [VibController],
  providers: [VibService],
})
export class VibModule {}
