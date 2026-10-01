import PouchDB from 'pouchdb-browser'
import { hashObject } from './hash'

export interface LandRecord {
  _id: string
  _rev?: string
  type: 'land_record'
  plotNumber: string
  ownerNin: string
  ownerName: string
  location: string
  areaSqm: number
  createdAt: string
  /** SHA-256 of the record content (everything except _id, _rev and hash). */
  hash: string
}

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error'

export const localDb = new PouchDB<LandRecord>('kiwanja_land_records')

const remoteDb = new PouchDB<LandRecord>(import.meta.env.VITE_COUCHDB_URL, {
  skip_setup: true,
  auth: {
    username: import.meta.env.VITE_COUCHDB_USER,
    password: import.meta.env.VITE_COUCHDB_PASSWORD,
  },
})

/** Live, retrying two-way sync. Works offline and catches up when the connection returns. */
export function startSync(onState: (s: SyncState) => void) {
  const sync = localDb
    .sync(remoteDb, { live: true, retry: true })
    .on('active', () => onState('syncing'))
    .on('paused', (err) => onState(err || !navigator.onLine ? 'offline' : 'synced'))
    .on('denied', () => onState('error'))
    .on('error', () => onState('error'))
  return () => sync.cancel()
}

export async function createLandRecord(
  input: Omit<LandRecord, '_id' | '_rev' | 'type' | 'createdAt' | 'hash'>,
): Promise<LandRecord> {
  const content = { ...input, type: 'land_record' as const, createdAt: new Date().toISOString() }
  const hash = await hashObject(content)
  const record: LandRecord = { _id: `plot:${input.plotNumber}`, ...content, hash }
  await localDb.put(record)
  return record
}

export async function verifyLandRecord(record: LandRecord): Promise<boolean> {
  const { _id, _rev, hash, ...content } = record
  void _id
  void _rev
  return (await hashObject(content)) === hash
}

export async function listLandRecords(): Promise<LandRecord[]> {
  const res = await localDb.allDocs({ include_docs: true, startkey: 'plot:', endkey: 'plot:￿' })
  return res.rows.map((r) => r.doc!).filter(Boolean)
}
