import { Link, useParams, useSearchParams } from 'react-router'
import { api } from '../../lib/api'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { HashText, KeyValues, Loading, Notice } from '../../components/ui'
import { formatDate, formatNumber, landUseLabel, partyLabel, presenceLabel } from '../../lib/format'
import type { PartyRole, PlotVerification, TransactionVerification, VerifyState } from '../../lib/types'

const verdicts: Record<VerifyState, { tone: 'ok' | 'warn' | 'bad'; title: string; body: string }> = {
  current: { tone: 'ok', title: 'Matches the sealed record', body: 'This code matches the record held by Kiwanja Block today.' },
  superseded: {
    tone: 'warn',
    title: 'This plot has changed hands since this code was printed',
    body: 'The plot was sold after this QR code was issued. Do not pay anyone on the strength of this code. Ask the Mwenyekiti for the current record.',
  },
  mismatch: {
    tone: 'bad',
    title: 'Does not match',
    body: 'The fingerprint in this code is not one this record has ever had. The code may be forged or copied wrongly.',
  },
  tampered: {
    tone: 'bad',
    title: 'Record failed its integrity check',
    body: 'The stored record no longer matches its own fingerprint. Report this to the ward land office.',
  },
  unknown: { tone: 'bad', title: 'No such record', body: 'Kiwanja Block has no record with this identifier.' },
}

function Verdict({ state }: { state: VerifyState }) {
  const v = verdicts[state]
  return (
    <Notice tone={v.tone} title={v.title} live>
      <p>{v.body}</p>
    </Notice>
  )
}

export function VerifyPlotPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const hash = params.get('h') ?? ''
  useTitle('Plot check')
  const { data, error, loading } = useResource(
    () => api<PlotVerification>(`/plots/${encodeURIComponent(id)}/verify?h=${encodeURIComponent(hash)}`, { auth: false }),
    `${id}:${hash}`,
  )

  return (
    <div className="container page narrow">
      <header className="page-head">
        <h1>Plot check</h1>
      </header>
      {loading && <Loading label="Checking the register" />}
      {error && <Notice tone="bad" title="Could not check this plot" live>{error.isNetwork ? 'You are offline. Checks need a connection.' : error.message}</Notice>}
      {data && (
        <>
          <Verdict state={data.state} />
          {data.plot && (
            <section className="panel">
              <h2>Plot {data.plot.plotNumber}</h2>
              <KeyValues
                items={[
                  ['Location', `${data.plot.ward}, ${data.plot.district}, ${data.plot.region}`],
                  ['Size', `${formatNumber(data.plot.sizeSqm)} m²`],
                  ['Use', landUseLabel[data.plot.landUse]],
                  ['Current owner', data.plot.ownerInitials],
                  ['Owner since', formatDate(data.plot.ownerSince)],
                  ['Recorded sales', String(data.plot.transfers)],
                ]}
              />
            </section>
          )}
          <p className="muted">
            Code checked: <HashText value={hash} />
          </p>
        </>
      )}
      <p>
        <Link to="/verify">Check another code</Link>
      </p>
    </div>
  )
}

export function VerifyTransactionPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const hash = params.get('h') ?? ''
  useTitle('Certificate check')
  const { data, error, loading } = useResource(
    () => api<TransactionVerification>(`/transactions/${encodeURIComponent(id)}/verify?h=${encodeURIComponent(hash)}`, { auth: false }),
    `${id}:${hash}`,
  )

  return (
    <div className="container page narrow">
      <header className="page-head">
        <h1>Land sale certificate check</h1>
      </header>
      {loading && <Loading label="Recomputing the fingerprint" />}
      {error && <Notice tone="bad" title="Could not check this certificate" live>{error.isNetwork ? 'You are offline. Checks need a connection.' : error.message}</Notice>}
      {data && (
        <>
          <Verdict state={data.state} />
          {data.transaction && (
            <section className="panel">
              <h2>Sale of plot {data.transaction.plotNumber}</h2>
              <KeyValues
                items={[
                  ['Location', `${data.transaction.ward}, ${data.transaction.district}, ${data.transaction.region}`],
                  ['Sealed on', formatDate(data.transaction.completedAt)],
                  ['Seller', data.transaction.sellerInitials],
                  ['Buyer', data.transaction.buyerInitials],
                  ['Witnessed by', `${data.transaction.leaderName}, Mwenyekiti`],
                  ['Ministry of Lands reference', data.transaction.ministryReference ?? 'Not yet submitted'],
                ]}
              />
            </section>
          )}
          {data.checks && (
            <section className="panel">
              <h2>What was rechecked just now</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Signer</th>
                    <th scope="col">Signature</th>
                    <th scope="col">Photo</th>
                    <th scope="col">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(data.checks) as PartyRole[]).map((role) => {
                    const c = data.checks![role]
                    return (
                      <tr key={role}>
                        <th scope="row">{partyLabel[role]}</th>
                        <td>{c.signatureIntact ? 'Intact' : 'Broken'}</td>
                        <td>{c.photoIntact ? 'Unchanged' : 'Changed or missing'}</td>
                        <td>{presenceLabel[c.presence]}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
      <p>
        <Link to="/verify">Check another code</Link>
      </p>
    </div>
  )
}
