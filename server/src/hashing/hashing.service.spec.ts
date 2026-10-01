import { HashingService } from './hashing.service.js';

describe('HashingService', () => {
  const hashing = new HashingService();

  it('computes SHA-256 hex digests', () => {
    expect(hashing.sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hashes objects independent of key order', () => {
    expect(hashing.hashObject({ a: 1, b: { c: 2, d: 3 } })).toBe(
      hashing.hashObject({ b: { d: 3, c: 2 }, a: 1 }),
    );
  });
});
