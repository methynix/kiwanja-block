import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  couch: {
    url: process.env.COUCHDB_URL ?? 'http://admin:password@localhost:5984',
    db: process.env.COUCHDB_DB ?? 'kiwanja_block',
  },
  session: {
    secret: process.env.SESSION_SECRET ?? 'dev-secret',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  },
  nidaMock: process.env.NIDA_MOCK === 'true',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
};