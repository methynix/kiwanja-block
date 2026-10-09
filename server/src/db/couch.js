import nano from 'nano';
import { config } from '../config/index.js';

export const couch = nano(config.couch.url);

export const DB = {
  users: 'kiwanja_users',
  plots: 'kiwanja_plots',
  sessions: 'kiwanja_sessions',
  audit: 'kiwanja_audit',
  transactions: 'kiwanja_transactions',
};

const ALL_DBS = Object.values(DB);

export async function ensureDatabases() {
  for (const name of ALL_DBS) {
    try {
      await couch.db.get(name);
    } catch (err) {
      if (err.statusCode === 404) {
        await couch.db.create(name);
        console.log(` Created CouchDB database: ${name}`);
      } else {
        throw err;
      }
    }
  }
}

export function db(name) {
  return couch.db.use(name);
}