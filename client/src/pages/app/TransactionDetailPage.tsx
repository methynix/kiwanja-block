import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../../lib/api'
import { formatDateTime, formatGps, formatTzs, maskNin, partyLabel, presenceLabel } from '../../lib/format'
import { useAuth } from '../../hooks/useAuth'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { HashText, KeyValues, Loading, Notice, Pill } from '../../components/ui'
import { EvidencePhoto } from '../../components/EvidencePhoto'
import type { PartyRole, Transaction } from '../../lib/types'

const ROLES: PartyRole[] = ['seller', 'buyer', 'leader']

export function TransactionDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const { data, error, loading, setData } = useResource(() => api<{ transaction: Transaction }>(`/transactions/${encodeURIComponent(id)}`), id)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  useTitle(data ? `Sale of ${data.transaction.plotNumber}` : 'Sale')

  if (loading && !data) return <Loading label="Loading sale" />
  if (error && !data) return <Notice tone="bad" live>{error.isNetwork ? 'This record needs a connection.' : error.message}</Notice>
  if (!data) return null
  const t = data.transaction
  const names: Record<PartyRole, string> = { seller: t.seller.fullName, buyer: t.buyer.fullName, leader: t.leader.fullName }
  const canSubmit = !t.ministry && (user?.role === 'officer' || (user?.role === 'mwenyekiti' && user.id === t.leader.userId))

  const submit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      setData(await api<{ transaction: Transaction }>(`/transactions/${encodeURIComponent(t.id)}/ministry`, { method: 'POST' }))
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-app">
      <p className="breadcrumb">
        <Link to="/app/transactions">{user?.role === 'citizen' ? 'My certificates' : 'Sales register'}</Link>
      </p>
      <header className="page-head page-head-row">
        <div>
          <h1>Sale of plot {t.plotNumber}</h1>
          <p className="muted">
            {t.ward}, {t.district} · sealed {formatDateTime(t.completedAt)}
          </p>
        </div>
        <Link to={`/app/transactions/${t.id}/certificate`} className="button">
          Certificate
        </Link>
      </header>

      <div className="detail-grid">
        <section className="panel">
          <h2>Agreement</h2>
          <KeyValues
            items={[
              ['Seller', `${t.seller.fullName} · ${maskNin(t.seller.nin)}`],
              ['Buyer', `${t.buyer.fullName} · ${maskNin(t.buyer.nin)}`],
              ['Witness', `${t.leader.fullName}, Mwenyekiti`],
              ['Price', formatTzs(t.priceTzs)],
              ...(t.notes ? [['Notes', t.notes] as [string, string]] : []),
              ['Recorded', t.capturedOffline ? `Offline, uploaded ${formatDateTime(t.receivedAt)}` : 'Online'],
              ['Plot', <Link key="p" to={`/app/plots/${t.plotId}`}>View plot record</Link>],
            ]}
          />
        </section>
        <section className="panel">
          <h2>Seal</h2>
          <KeyValues
            items={[
              ['Sale fingerprint', <HashText key="t" value={t.transactionHash} />],
              ['Plot before', <HashText key="b" value={t.plotHashBefore} />],
              ['Plot after', <HashText key="a" value={t.plotHashAfter} />],
              [
                'Ministry of Lands',
                t.ministry ? (
                  <span key="m">
                    <Pill tone="ok">Received</Pill> <span className="mono">{t.ministry.reference}</span>
                  </span>
                ) : (
                  'Not submitted'
                ),
              ],
            ]}
          />
          {canSubmit && (
            <button type="button" className="button button-secondary" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting' : 'Submit transfer to Ministry of Lands'}
            </button>
          )}
          {submitError && <p className="field-error">{submitError}</p>}
        </section>
      </div>

      <section aria-labelledby="evidence-heading">
        <h2 id="evidence-heading">Signatures and evidence</h2>
        <ol className="evidence">
          {ROLES.map((role) => {
            const e = t.evidence[role]
            return (
              <li key={role} className="evidence-card">
                <EvidencePhoto transactionId={t.id} role={role} alt={`${partyLabel[role]} ${names[role]}, photographed when signing`} />
                <div>
                  <h3>
                    {partyLabel[role]}: {names[role]}
                  </h3>
                  <KeyValues
                    items={[
                      ['Signed', formatDateTime(e.signedAt)],
                      ['Location', e.gps ? <span key="g" className="mono">{formatGps(e.gps)}</span> : 'Not captured'],
                      [
                        'Presence',
                        <Pill key="p" tone={e.presence === 'verified' ? 'ok' : e.presence === 'plot_has_no_gps' ? 'muted' : 'warn'}>
                          {presenceLabel[e.presence]}
                          {e.distanceFromPlotM !== null ? `, ${e.distanceFromPlotM} m` : ''}
                        </Pill>,
                      ],
                      ['Signature', <HashText key="s" value={t.signatures[role]} />],
                    ]}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
