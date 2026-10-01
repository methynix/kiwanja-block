import crypto from 'node:crypto';

export function sha256(input) {
  const data = typeof input === 'string' ? input : JSON.stringify(input);
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function canonicalize(obj) {
  // Stable stringify (sorted keys) so hashes are deterministic
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalize).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

export function hashRecord(obj) {
  return sha256(canonicalize(obj));
}