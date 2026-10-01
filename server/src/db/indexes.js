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

  await upsertDesignDoc(DB.plots, {
    _id: 'by_plot_number',
    views: {
      by_plot_number: {
        map: `function (doc) {
          if (doc.type === 'plot' && doc.plotNumber) {
            emit([doc.ward, doc.plotNumber], doc);
          }
        }`,
      },
    },
  });

  console.log('✅ CouchDB design docs ensured');
}