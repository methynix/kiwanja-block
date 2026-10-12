import { useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { Empty, Loading, Notice } from '../../components/ui'
import { TransactionTable } from '../../components/TransactionTable'
import type { Transaction } from '../../lib/types'

type Filter = 'all' | 'awaiting' | 'flagged'

export function TransactionsPage() {
  const { user } = useAuth()
  useTitle(user?.role === 'citizen' ? 'My certificates' : 'Sales register')
  const { data, error, loading } = useResource(() => api<{ transactions: Transaction[] }>('/transactions'), 'transactions')
  const [filter, setFilter] = useState<Filter>('all')

  const list = useMemo(() => {
    const all = data?.transactions ?? []
    if (filter === 'awaiting') return all.filter((t) => !t.ministry)
    if (filter === 'flagged') return all.filter((t) => Object.values(t.evidence).some((e) => e.presence === 'far' || e.presence === 'no_gps'))
    return all
  }, [data, filter])

  return (
    <div className="page-app">
      <header className="page-head">
        <h1>{user?.role === 'citizen' ? 'My certificates' : 'Sales register'}</h1>
        <p className="muted">
          {user?.role === 'citizen'
            ? 'Sales where you were the buyer or the seller.'
            : user?.role === 'mwenyekiti'
              ? `Every sale sealed in ${user.ward}.`
              : 'Every sale sealed across wards.'}
        </p>
      </header>
      {user?.role !== 'citizen' && (
        <div className="segmented" role="group" aria-label="Filter sales">
          {(
            [
              ['all', 'All'],
              ['awaiting', 'Not yet at Ministry'],
              ['flagged', 'Location flags'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      )}
      {loading && <Loading label="Loading sales" />}
      {error && <Notice tone="bad" live>{error.isNetwork ? 'The register needs a connection.' : error.message}</Notice>}
      {data && (list.length ? <TransactionTable transactions={list} showWard={user?.role === 'officer'} /> : <Empty title="Nothing to show here" />)}
    </div>
  )
}
