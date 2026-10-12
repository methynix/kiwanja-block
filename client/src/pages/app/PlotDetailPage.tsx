import { Link, useParams } from 'react-router'
import { api } from '../../lib/api'
import { getCachedPlot } from '../../lib/local'
import { formatDate, formatGps, formatNumber, landUseLabel, maskNin } from '../../lib/format'
import { useAuth } from '../../hooks/useAuth'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { Empty, HashText, KeyValues, Loading, Notice } from '../../components/ui'
import { TransactionTable } from '../../components/TransactionTable'
import type { Plot, Transaction } from '../../lib/types'

interface Detail {
  plot: Plot
  transactions: Transaction[]
  qrDataUrl: string | null
  fromCache: boolean
}

async function loadDetail(id: string): Promise<Detail> {
  try {
    const [{ plot, transactions }, qr] = await Promise.all([
      api<{ plot: Plot; transactions: Transaction[] }>(`/plots/${encodeURIComponent(id)}`),
      api<{ qrDataUrl: string }>(`/plots/${encodeURIComponent(id)}/qr`),
    ])
    return { plot, transactions, qrDataUrl: qr.qrDataUrl, fromCache: false }
  } catch (err) {
    const cached = await getCachedPlot(id)
    if (cached) return { plot: cached, transactions: [], qrDataUrl: null, fromCache: true }
    throw err
  }
}

export function PlotDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { data, error, loading } = useResource(() => loadDetail(id), id)
  useTitle(data ? `Plot ${data.plot.plotNumber}` : 'Plot')

  if (loading && !data) return <Loading label="Loading plot" />
  if (error && !data) return <Notice tone="bad" live>{error.message}</Notice>
  if (!data) return null
  const { plot, transactions, qrDataUrl, fromCache } = data

  return (
    <div className="page-app">
      <p className="breadcrumb">
        <Link to="/app/plots">Plots</Link>
      </p>
      <header className="page-head page-head-row">
        <div>
          <h1>Plot {plot.plotNumber}</h1>
          <p className="muted">
            {plot.ward}, {plot.district}, {plot.region}
          </p>
        </div>
        {user?.role === 'mwenyekiti' && (
          <Link to={`/app/handshake?plot=${encodeURIComponent(plot.id)}`} className="button">
            Record a sale of this plot
          </Link>
        )}
      </header>
      {fromCache && (
        <Notice tone="info" title="Offline copy">
          <p>Sales history and the QR label appear when you reconnect.</p>
        </Notice>
      )}
      <div className="detail-grid">
        <section className="panel">
          <h2>Record</h2>
          <KeyValues
            items={[
              ['Owner', plot.ownerName],
              ['Owner NIDA', maskNin(plot.ownerNin)],
              ['Owner since', formatDate(plot.ownerSince)],
              ['Size', `${formatNumber(plot.sizeSqm)} m²`],
              ['Use', landUseLabel[plot.landUse]],
              ['Surveyed point', plot.gps ? <span key="g" className="mono">{formatGps(plot.gps)}</span> : 'Not surveyed'],
              ['Registered', formatDate(plot.registeredAt)],
              ['Fingerprint', <HashText key="h" value={plot.integrityHash} />],
            ]}
          />
        </section>
        <section className="panel qr-label" aria-labelledby="qr-heading">
          <h2 id="qr-heading">QR label</h2>
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt={`QR code that verifies plot ${plot.plotNumber} in ${plot.ward}`} width={220} height={220} />
              <p className="muted">Print and fix this to the plot’s beacon or gate. It stops verifying when the plot is sold.</p>
              <button type="button" className="button button-secondary" onClick={() => window.print()}>
                Print label
              </button>
            </>
          ) : (
            <p className="muted">Available online.</p>
          )}
        </section>
      </div>

      {plot.ownershipHistory.length > 0 && (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading">Previous owners</h2>
          <ol className="history">
            {[...plot.ownershipHistory].reverse().map((h) => (
              <li key={h.transactionId}>
                <strong>{h.ownerName}</strong>
                <span className="muted">
                  {formatDate(h.from)} to {formatDate(h.to)}
                </span>
                <Link to={`/app/transactions/${h.transactionId}`}>Sale record</Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!fromCache && (
        <section aria-labelledby="sales-heading">
          <h2 id="sales-heading">Sales of this plot</h2>
          {transactions.length ? <TransactionTable transactions={transactions} /> : <Empty title="No sales recorded" />}
        </section>
      )}
    </div>
  )
}
