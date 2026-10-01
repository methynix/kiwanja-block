import { Module } from '@nestjs/common';
import { NidaController } from './nida.controller.js';
import { NidaService } from './nida.service.js';

@Module({
  controllers: [NidaController],
  providers: [NidaService],
  exports: [NidaService],
})
export class NidaModule {}
