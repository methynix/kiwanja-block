import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { config } from './config/index.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { nidaRouter } from './modules/nida/nida.routes.js';
import { plotsRouter } from './modules/plots/plots.routes.js';
import { transactionsRouter } from './modules/transactions/transactions.routes.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiLimiter, enforceHttps, noStore } from './middleware/security.js';

const smallJson = express.json({ limit: '10kb' });
const isHandshakeUpload = (req) => req.method === 'POST' && req.path === '/api/transactions';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(enforceHttps);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  if (config.env !== 'test') app.use(morgan(config.isProd ? 'tiny' : 'dev'));
  app.use(cookieParser());
  app.use((req, res, next) => (isHandshakeUpload(req) ? next() : smallJson(req, res, next)));
  app.use('/api', noStore, apiLimiter);

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', service: 'kiwanja-block-api', timestamp: new Date().toISOString() }),
  );

  app.use('/api/auth', authRouter);
  app.use('/api/nida', nidaRouter);
  app.use('/api/plots', plotsRouter);
  app.use('/api/transactions', transactionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
