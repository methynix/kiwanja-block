import { db, DB } from './couch.js';

async function upsertDesignDoc(dbName, designDoc) {
  const target = db(dbName);
  const id = `_design/${designDoc._id}`;
  try {
    const existing = await target.get(id);
    designDoc._rev = existing._rev;
  } catch (err) {
    if (err.statusCode !== 404) throw err;
  }
  await target.insert(designDoc);
}

export async function ensureIndexes() {
  // Users: lookup by phone (used as login identifier)
  await upsertDesignDoc(DB.users, {
    _id: 'by_phone',
    views: {
      by_phone: {
        map: `function (doc) {
          if (doc.type === 'user' && doc.phone) emit(doc.phone, doc);
        }`,
      },
    },
  });

  await upsertDesignDoc(DB.transactions, {
  _id: 'by_plot',
  views: {
    by_plot: {
      map: `function (doc) {
        if (doc.type === 'transaction' && doc.plotId) {
          emit([doc.plotId, doc.createdAt], doc);
        }
      }`,
    },
    by_status: {
      map: `function (doc) {
        if (doc.type === 'transaction' && doc.status) {
          emit([doc.status, doc.createdAt], doc);
        }
      }`,
    },
    by_party: {
      map: `function (doc) {
        if (doc.type === 'transaction') {
          if (doc.seller?.userId) emit(['seller', doc.seller.userId], doc);
          if (doc.buyer?.userId)   emit(['buyer',  doc.buyer.userId],  doc);
          if (doc.leader?.userId)  emit(['leader', doc.leader.userId], doc);
        }
      }`,
    },
  },
});

  console.log('✅ CouchDB design docs ensured');
}