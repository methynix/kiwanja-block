import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/index.js';
import { ensureDatabases } from './db/couch.js';
import { ensureIndexes } from './db/indexes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { nidaRouter } from './modules/nida/nida.routes.js';
import { plotsRouter } from './modules/plots/plots.routes.js';
import { transactionsRouter } from './modules/transactions/transactions.routes.js';
import { errorHandler, notFound } from './middleware/error.js';

async function bootstrap() {
  await ensureDatabases();
  await ensureIndexes();

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  // Health
  app.get('/api/health', (_req, res) =>
    res.json({
      status: 'ok',
      service: 'kiwanja-block-backend',
      timestamp: new Date().toISOString(),
    }),
  );

  // Modules
  app.use('/api/auth', authRouter);
  app.use('/api/nida', nidaRouter);
  app.use('/api/plots', plotsRouter);
  app.use('/api/transactions', transactionsRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`🚀 KIWANJA-BLOCK backend on http://localhost:${config.port}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});