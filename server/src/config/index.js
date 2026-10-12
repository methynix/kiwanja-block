import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const env = process.env.NODE_ENV ?? 'development';
const isProd = env === 'production';

function required(name, devFallback) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`Missing required environment variable ${name}`);
  return devFallback;
}

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT ?? 3000),
  trustProxy: process.env.TRUST_PROXY === 'true',
  couch: {
    url: required('COUCHDB_URL', 'http://admin:changeme@localhost:5984'),
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev-only-jwt-secret-change-me'),
    accessTtl: '15m',
  },
  refresh: {
    cookieName: 'kb_rt',
    ttlDays: 7,
  },
  nidaMock: process.env.NIDA_MOCK !== 'false',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  uploads: {
    maxPhotoBytes: 1_200_000,
  },
  presenceRadiusM: Number(process.env.PRESENCE_RADIUS_M ?? 300),
};
