import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api'
import { cachePlots, getCachedPlots } from '../../lib/local'
import { formatDateTime, formatNumber, formatTzs, landUseLabel } from '../../lib/format'
import { useAuth } from '../../hooks/useAuth'
import { useOnline } from '../../hooks/useOnline'
import { useOutbox } from '../../hooks/useOutbox'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { Empty, Loading, Notice } from '../../components/ui'
import { TransactionTable } from '../../components/TransactionTable'
import type { Plot, Stats, Transaction } from '../../lib/types'

function StaffOverview() {
  const { user } = useAuth()
  const online = useOnline()
  const { pending, rejected } = useOutbox()
  const stats = useResource(() => api<Stats>('/transactions/stats'), 'stats')
  const cached = useResource(() => getCachedPlots(), 'cached-plots')
  const [preparing, setPreparing] = useState(false)
  const [prepError, setPrepError] = useState<string | null>(null)

  const prepare = async () => {
    setPreparing(true)
    setPrepError(null)
    try {
      const { plots } = await api<{ plots: Plot[] }>('/plots')
      await cachePlots(plots)
      cached.reload()
    } catch (err) {
      setPrepError((err as Error).message)
    } finally {
      setPreparing(false)
    }
  }

  const s = stats.data
  return (
    <>
      <header className="page-head page-head-row">
        <div>
          <h1>{user?.role === 'mwenyekiti' ? `Mtaa wa ${user.ward}` : 'All wards'}</h1>
          <p className="muted">{user?.role === 'mwenyekiti' ? 'Your ward register' : 'Land office overview'}</p>
        </div>
        {user?.role === 'mwenyekiti' && (
          <Link to="/app/handshake" className="button button-large">
            Record a sale
          </Link>
        )}
      </header>

      {rejected.length > 0 && (
        <Notice tone="bad" title={`${rejected.length} recorded sale(s) were refused by the server`}>
          <p>
            <Link to="/app/sync">See why in the sync queue</Link>
          </p>
        </Notice>
      )}

      {user?.role === 'mwenyekiti' && (
        <section className="panel offline-pack" aria-labelledby="offline-heading">
          <div>
            <h2 id="offline-heading">Ready for work without signal</h2>
            <p className="muted">
              {cached.data?.savedAt
                ? `${cached.data.plots.length} plots saved on this phone, last updated ${formatDateTime(cached.data.savedAt)}.`
                : 'No plots saved on this phone yet. Save them before you go to a plot with weak network.'}
              {pending.length > 0 && ` ${pending.length} sale(s) waiting to upload.`}
            </p>
            {prepError && <p className="field-error">{prepError}</p>}
          </div>
          <button type="button" className="button button-secondary" onClick={prepare} disabled={!online || preparing}>
            {preparing ? 'Saving plots' : 'Save ward plots to this phone'}
          </button>
        </section>
      )}

      {stats.loading && !s && <Loading label="Reading the register" />}
      {stats.error && !s && (
        <Notice tone="warn" title="Figures need a connection">
          <p>{stats.error.isNetwork ? 'You are offline. Recording sales still works.' : stats.error.message}</p>
        </Notice>
      )}
      {s && (
        <>
          <dl className="figures" aria-label="Register figures">
            <div>
              <dt>Plots registered</dt>
              <dd>{formatNumber(s.plots)}</dd>
            </div>
            <div>
              <dt>Sales sealed</dt>
              <dd>{formatNumber(s.transactions)}</dd>
              <span className="muted">{s.last30Days} in the last 30 days</span>
            </div>
            <div>
              <dt>Declared value</dt>
              <dd>{formatTzs(s.valueTzs)}</dd>
            </div>
            <div>
              <dt>Waiting for Ministry</dt>
              <dd>{formatNumber(s.awaitingMinistry)}</dd>
              <span className="muted">{s.submittedToMinistry} submitted</span>
            </div>
            <div>
              <dt>Location flags</dt>
              <dd>{formatNumber(s.presenceFlagged)}</dd>
              <span className="muted">signed away from the plot or without GPS</span>
            </div>
          </dl>
          <section aria-labelledby="recent-heading">
            <div className="section-head-row">
              <h2 id="recent-heading">Latest sales</h2>
              <Link to="/app/transactions">Full register</Link>
            </div>
            {s.recent.length ? <TransactionTable transactions={s.recent} showWard={user?.role === 'officer'} /> : <Empty title="No sales recorded yet" />}
          </section>
        </>
      )}
    </>
  )
}

function CitizenOverview() {
  const { user } = useAuth()
  const plots = useResource(() => api<{ plots: Plot[] }>('/plots'), 'my-plots')
  const txs = useResource(() => api<{ transactions: Transaction[] }>('/transactions'), 'my-transactions')

  return (
    <>
      <header className="page-head">
        <h1>Karibu, {user?.fullName.split(' ')[0]}</h1>
        <p className="muted">Plots registered to your NIDA number, and sales you took part in.</p>
      </header>
      <section aria-labelledby="my-plots">
        <h2 id="my-plots">My plots</h2>
        {plots.loading && <Loading />}
        {plots.error && <Notice tone="warn">{plots.error.message}</Notice>}
        {plots.data && plots.data.plots.length === 0 && (
          <Empty title="No plots are registered to you">
            <p className="muted">When a sale to you is sealed, the plot appears here.</p>
          </Empty>
        )}
        <ul className="card-list">
          {plots.data?.plots.map((p) => (
            <li key={p.id} className="plot-card">
              <p className="plot-card-number">{p.plotNumber}</p>
              <p>
                {p.ward}, {p.district}
              </p>
              <p className="muted">
                {formatNumber(p.sizeSqm)} m² · {landUseLabel[p.landUse]}
              </p>
              <a href={p.verificationUrl}>Public check for this plot</a>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="my-sales">
        <h2 id="my-sales">My sales and purchases</h2>
        {txs.loading && <Loading />}
        {txs.data && (txs.data.transactions.length ? <TransactionTable transactions={txs.data.transactions} /> : <Empty title="No sales yet" />)}
      </section>
    </>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  useTitle('Overview')
  return <div className="page-app">{user?.role === 'citizen' ? <CitizenOverview /> : <StaffOverview />}</div>
}
