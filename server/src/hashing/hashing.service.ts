import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

@Injectable()
export class HashingService {
  sha256(data: string): string {
    return createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /** Hash an object deterministically (keys sorted) so equal content always yields the same hash. */
  hashObject(value: unknown): string {
    return this.sha256(stableStringify(value));
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}
