import { useEffect, useState } from 'react'
import { listOutbox, onOutboxChange } from '../lib/local'
import type { OutboxEntry } from '../lib/types'

export function useOutbox() {
  const [entries, setEntries] = useState<OutboxEntry[]>([])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      listOutbox().then((list) => {
        if (!cancelled) setEntries(list)
      })
    void load()
    const unsubscribe = onOutboxChange(() => void load())
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const pending = entries.filter((e) => e.status === 'queued' || e.status === 'syncing')
  const rejected = entries.filter((e) => e.status === 'rejected')
  return { entries, pending, rejected }
}
