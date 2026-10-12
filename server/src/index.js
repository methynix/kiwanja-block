import { config } from './config/index.js';
import { ensureDatabases } from './db/couch.js';
import { ensureIndexes } from './db/indexes.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await ensureDatabases();
  await ensureIndexes();

  createApp().listen(config.port, () => {
    logger.info('api_listening', { url: `http://localhost:${config.port}/api`, env: config.env });
  });
}

bootstrap().catch((err) => {
  logger.error('startup_failed', { message: err.message });
  process.exit(1);
});
