import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CouchService } from './couch/couch.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: CouchService, useValue: { ping: async () => true } }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('reports health', async () => {
    expect(await appController.health()).toEqual({ status: 'ok', couchdb: 'up' });
  });
});
