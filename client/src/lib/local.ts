import PouchDB from 'pouchdb-browser'
import type { OutboxEntry, Plot, User } from './types'

interface CacheDoc<T> {
  _id: string
  _rev?: string
  data: T
  savedAt: string
}

let cacheDb = new PouchDB<CacheDoc<unknown>>('kb_cache')
let outboxDb = new PouchDB<OutboxEntry>('kb_outbox')

const OUTBOX_EVENT = 'kb:outbox'

export function onOutboxChange(listener: () => void) {
  window.addEventListener(OUTBOX_EVENT, listener)
  return () => window.removeEventListener(OUTBOX_EVENT, listener)
}

function notifyOutbox() {
  window.dispatchEvent(new Event(OUTBOX_EVENT))
}

async function put<T>(id: string, data: T) {
  const existing = await cacheDb.get(id).catch(() => null)
  await cacheDb.put({ _id: id, _rev: existing?._rev, data, savedAt: new Date().toISOString() })
}

async function read<T>(id: string): Promise<CacheDoc<T> | null> {
  return (await cacheDb.get(id).catch(() => null)) as CacheDoc<T> | null
}

export async function cacheProfile(user: User) {
  await put('profile', user)
}

export async function getCachedProfile(): Promise<User | null> {
  return (await read<User>('profile'))?.data ?? null
}

export async function cachePlots(plots: Plot[]) {
  await put('plots', plots)
}

export async function getCachedPlots(): Promise<{ plots: Plot[]; savedAt: string | null }> {
  const doc = await read<Plot[]>('plots')
  return { plots: doc?.data ?? [], savedAt: doc?.savedAt ?? null }
}

export async function getCachedPlot(id: string): Promise<Plot | null> {
  const { plots } = await getCachedPlots()
  return plots.find((p) => p.id === id) ?? null
}

export async function replaceCachedPlot(plot: Plot) {
  const { plots } = await getCachedPlots()
  await cachePlots([...plots.filter((p) => p.id !== plot.id), plot])
}

export async function addToOutbox(entry: OutboxEntry) {
  await outboxDb.put(entry)
  notifyOutbox()
}

export async function listOutbox(): Promise<OutboxEntry[]> {
  const res = await outboxDb.allDocs({ include_docs: true })
  return res.rows
    .map((r) => r.doc as OutboxEntry)
    .filter(Boolean)
    .sort((a, b) => b.queuedAt.localeCompare(a.queuedAt))
}

export async function updateOutbox(id: string, patch: Partial<OutboxEntry>) {
  const current = await outboxDb.get(id)
  await outboxDb.put({ ...current, ...patch })
  notifyOutbox()
}

export async function removeOutbox(id: string) {
  const current = await outboxDb.get(id).catch(() => null)
  if (current) await outboxDb.remove(current)
  notifyOutbox()
}

export async function pendingOutboxCount() {
  return (await listOutbox()).filter((e) => e.status === 'queued' || e.status === 'syncing').length
}

export async function clearLocalData() {
  await Promise.all([cacheDb.destroy(), outboxDb.destroy()])
  cacheDb = new PouchDB('kb_cache')
  outboxDb = new PouchDB('kb_outbox')
  notifyOutbox()
}
