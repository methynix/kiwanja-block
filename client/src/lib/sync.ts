import { api, ApiError } from './api'
import { listOutbox, replaceCachedPlot, updateOutbox } from './local'
import type { OutboxEntry, Plot, Transaction } from './types'

let running = false

const isRetryable = (err: ApiError) => err.isNetwork || err.status === 401 || err.status === 429 || err.status >= 500

async function submitOne(entry: OutboxEntry) {
  if (!entry.bundle) return
  await updateOutbox(entry._id, { status: 'syncing', attempts: entry.attempts + 1 })
  try {
    const { transaction } = await api<{ transaction: Transaction }>('/transactions', { method: 'POST', body: entry.bundle })
    await updateOutbox(entry._id, {
      status: 'accepted',
      bundle: null,
      transactionHash: transaction.transactionHash,
      settledAt: new Date().toISOString(),
      lastError: null,
      errorCode: null,
    })
    const refreshed = await api<{ plot: Plot }>(`/plots/${encodeURIComponent(transaction.plotId)}`).catch(() => null)
    if (refreshed) await replaceCachedPlot(refreshed.plot)
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(0, (err as Error).message)
    if (isRetryable(apiErr)) {
      await updateOutbox(entry._id, { status: 'queued', lastError: apiErr.message, errorCode: apiErr.code ?? null })
      throw apiErr
    }
    await updateOutbox(entry._id, {
      status: 'rejected',
      bundle: null,
      lastError: apiErr.message,
      errorCode: apiErr.code ?? null,
      settledAt: new Date().toISOString(),
    })
  }
}

export async function syncOutbox(): Promise<{ attempted: number; stoppedEarly: boolean }> {
  if (running || !navigator.onLine) return { attempted: 0, stoppedEarly: false }
  running = true
  let attempted = 0
  try {
    const queue = (await listOutbox())
      .filter((e) => e.status === 'queued' || e.status === 'syncing')
      .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt))
    for (const entry of queue) {
      attempted += 1
      try {
        await submitOne(entry)
      } catch {
        return { attempted, stoppedEarly: true }
      }
    }
    return { attempted, stoppedEarly: false }
  } finally {
    running = false
  }
}
