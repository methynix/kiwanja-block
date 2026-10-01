import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/** Minimal CouchDB client over its HTTP API. */
@Injectable()
export class CouchService implements OnModuleInit {
  private readonly logger = new Logger(CouchService.name);
  private readonly baseUrl = process.env.COUCHDB_URL ?? 'http://localhost:5984';
  private readonly auth =
    'Basic ' +
    Buffer.from(
      `${process.env.COUCHDB_USER ?? 'admin'}:${process.env.COUCHDB_PASSWORD ?? 'changeme'}`,
    ).toString('base64');

  readonly databases = ['land_records'];

  async onModuleInit() {
    for (const db of this.databases) {
      try {
        await this.ensureDatabase(db);
      } catch (err) {
        this.logger.warn(`CouchDB not reachable (${(err as Error).message}); is docker compose up?`);
        return;
      }
    }
  }

  async ensureDatabase(db: string) {
    const res = await this.request('PUT', `/${db}`);
    if (res.ok) this.logger.log(`Created database "${db}"`);
    else if (res.status !== 412) throw new Error(`Failed to create ${db}: ${res.status}`);
  }

  async get<T>(db: string, id: string): Promise<T | null> {
    const res = await this.request('GET', `/${db}/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`CouchDB GET failed: ${res.status}`);
    return (await res.json()) as T;
  }

  async put(db: string, id: string, doc: object): Promise<{ id: string; rev: string }> {
    const res = await this.request('PUT', `/${db}/${encodeURIComponent(id)}`, doc);
    if (!res.ok) throw new Error(`CouchDB PUT failed: ${res.status} ${await res.text()}`);
    return (await res.json()) as { id: string; rev: string };
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.request('GET', '/_up')).ok;
    } catch {
      return false;
    }
  }

  private request(method: string, path: string, body?: object) {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: this.auth, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
