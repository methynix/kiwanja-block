import { db, DB } from '../../db/couch.js';
import { newId } from '../../utils/ids.js';

export async function appendAudit(entry) {
  await db(DB.audit).insert({
    _id: newId('audit'),
    type: 'audit',
    ...entry,
    at: new Date().toISOString(),
  });
}
