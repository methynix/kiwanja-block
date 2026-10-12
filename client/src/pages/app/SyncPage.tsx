import { useState } from 'react'
import { Link } from 'react-router'
import { removeOutbox } from '../../lib/local'
import { syncOutbox } from '../../lib/sync'
import { formatDateTime, formatTzs } from '../../lib/format'
import { useOnline } from '../../hooks/useOnline'
import { useOutbox } from '../../hooks/useOutbox'
import { useTitle } from '../../hooks/useTitle'
import { Empty, HashText, Notice, Pill } from '../../components/ui'
import type { OutboxEntry } from '../../lib/types'

const statusPill: Record<OutboxEntry['status'], { tone: 'info' | 'ok' | 'bad' | 'muted'; label: string }> = {
  queued: { tone: 'info', label: 'Waiting' },
  syncing: { tone: 'info', label: 'Uploading' },
  accepted: { tone: 'ok', label: 'Sealed' },
  rejected: { tone: 'bad', label: 'Refused' },
}

export function SyncPage() {
  useTitle('Sync queue')
  const online = useOnline()
  const { entries, pending } = useOutbox()
  const [busy, setBusy] = useState(false)

  const runNow = async () => {
    setBusy(true)
    try {
      await syncOutbox()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-app">
      <header className="page-head page-head-row">
        <div>
          <h1>Sync queue</h1>
          <p className="muted">Sales recorded on this phone, and what the server decided.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={runNow} disabled={!online || busy || pending.length === 0}>
          {busy ? 'Uploading' : 'Upload now'}
        </button>
      </header>
      {!online && pending.length > 0 && (
        <Notice tone="info" title={`${pending.length} sale(s) waiting for a connection`}>
          <p>They upload by themselves when the phone is back online.</p>
        </Notice>
      )}
      {entries.length === 0 && <Empty title="Nothing recorded on this phone yet" />}
      <ul className="outbox">
        {entries.map((e) => (
          <li key={e._id} className={`outbox-item is-${e.status}`}>
            <div className="outbox-main">
              <p className="outbox-title">
                Plot {e.plotNumber} <Pill tone={statusPill[e.status].tone}>{statusPill[e.status].label}</Pill>
              </p>
              <p>
                {e.sellerName} to {e.buyerName}, {formatTzs(e.priceTzs)}
              </p>
              <p className="muted small">
                Recorded {formatDateTime(e.queuedAt)}
                {e.attempts > 0 && ` · ${e.attempts} upload attempt(s)`}
              </p>
              <p className="small">
                Receipt <HashText value={e.receiptHash} />
              </p>
              {e.status === 'rejected' && <p className="field-error">{e.lastError}</p>}
              {e.status === 'queued' && e.lastError && <p className="muted small">Last attempt: {e.lastError}</p>}
            </div>
            <div className="outbox-actions">
              {e.status === 'accepted' && <Link to={`/app/transactions/${e._id}`}>Open sale</Link>}
              {(e.status === 'accepted' || e.status === 'rejected') && (
                <button type="button" className="link-button" onClick={() => void removeOutbox(e._id)}>
                  Remove from list
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
