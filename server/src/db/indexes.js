import { db, DB } from './couch.js';
import { logger } from '../utils/logger.js';

async function upsertDesignDoc(dbName, name, views) {
  const target = db(dbName);
  const designDoc = { _id: `_design/${name}`, language: 'javascript', views };
  try {
    const existing = await target.get(designDoc._id);
    designDoc._rev = existing._rev;
  } catch (err) {
    if (err.statusCode !== 404) throw err;
  }
  await target.insert(designDoc);
}

export async function ensureIndexes() {
  await upsertDesignDoc(DB.users, 'users', {
    by_phone: {
      map: `function (doc) {
        if (doc.type === 'user' && doc.phone) emit(doc.phone, null);
      }`,
    },
    by_nin: {
      map: `function (doc) {
        if (doc.type === 'user' && doc.nin) emit(doc.nin, null);
      }`,
    },
    by_role: {
      map: `function (doc) {
        if (doc.type === 'user') emit([doc.role, doc.createdAt], null);
      }`,
    },
  });

  await upsertDesignDoc(DB.plots, 'plots', {
    by_plot_number: {
      map: `function (doc) {
        if (doc.type === 'plot') emit([doc.ward, doc.plotNumber], null);
      }`,
    },
    by_owner: {
      map: `function (doc) {
        if (doc.type === 'plot') emit(doc.ownerNin, null);
      }`,
    },
    by_ward: {
      map: `function (doc) {
        if (doc.type === 'plot') emit(doc.ward, null);
      }`,
    },
  });

  await upsertDesignDoc(DB.transactions, 'transactions', {
    by_plot: {
      map: `function (doc) {
        if (doc.type === 'transaction') emit([doc.plotId, doc.createdAt], null);
      }`,
    },
    by_ward: {
      map: `function (doc) {
        if (doc.type === 'transaction') emit([doc.ward, doc.createdAt], null);
      }`,
    },
    by_nin: {
      map: `function (doc) {
        if (doc.type === 'transaction') {
          emit([doc.seller.nin, doc.createdAt], 'seller');
          emit([doc.buyer.nin, doc.createdAt], 'buyer');
        }
      }`,
    },
    all_by_date: {
      map: `function (doc) {
        if (doc.type === 'transaction') emit(doc.createdAt, null);
      }`,
    },
  });

  await upsertDesignDoc(DB.sessions, 'sessions', {
    by_user: {
      map: `function (doc) {
        if (doc.type === 'session') emit(doc.userId, null);
      }`,
    },
  });

  logger.info('couchdb_design_docs_ready');
}
