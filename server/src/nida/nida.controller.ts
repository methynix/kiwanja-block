import { Controller, Get, Param } from '@nestjs/common';
import { NidaService } from './nida.service.js';

@Controller('nida')
export class NidaController {
  constructor(private readonly nida: NidaService) {}

  @Get('verify/:nin')
  verify(@Param('nin') nin: string) {
    return this.nida.verify(nin);
  }
}
