import { Injectable } from '@nestjs/common';
import { CouchService } from './couch/couch.service.js';

@Injectable()
export class AppService {
  constructor(private readonly couch: CouchService) {}

  async health() {
    return { status: 'ok', couchdb: (await this.couch.ping()) ? 'up' : 'down' };
  }
}
