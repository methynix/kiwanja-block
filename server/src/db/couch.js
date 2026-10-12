import nano from 'nano';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const couch = nano(config.couch.url);

export const DB = {
  users: 'kiwanja_users',
  plots: 'kiwanja_plots',
  sessions: 'kiwanja_sessions',
  audit: 'kiwanja_audit',
  transactions: 'kiwanja_transactions',
};

export async function ensureDatabases() {
  for (const name of Object.values(DB)) {
    try {
      await couch.db.get(name);
    } catch (err) {
      if (err.statusCode !== 404) throw err;
      await couch.db.create(name);
      logger.info('couchdb_database_created', { name });
    }
  }
}

export function db(name) {
  return couch.db.use(name);
}

export async function viewDocs(dbName, design, view, params = {}) {
  const result = await db(dbName).view(design, view, { ...params, include_docs: true });
  return result.rows.filter((r) => r.doc).map((r) => r.doc);
}
