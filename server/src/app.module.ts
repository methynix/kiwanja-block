import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CouchModule } from './couch/couch.module.js';
import { HashingModule } from './hashing/hashing.module.js';
import { NidaModule } from './nida/nida.module.js';

@Module({
  imports: [CouchModule, HashingModule, NidaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
