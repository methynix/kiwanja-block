import { Link, useParams } from 'react-router'
import { api } from '../../lib/api'
import { formatDate, formatTzs, maskNin, partyLabel } from '../../lib/format'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { Loading, Notice } from '../../components/ui'
import { LogoMark } from '../../components/Logo'
import type { PartyRole, Transaction } from '../../lib/types'

interface Certificate {
  transaction: Transaction
  verificationUrl: string
  qrDataUrl: string
}

export function CertificatePage() {
  const { id = '' } = useParams()
  const { data, error, loading } = useResource(() => api<Certificate>(`/transactions/${encodeURIComponent(id)}/certificate`), id)
  useTitle('Land sale certificate')

  if (loading && !data) return <Loading label="Preparing certificate" />
  if (error && !data) return <Notice tone="bad" live>{error.isNetwork ? 'The certificate needs a connection.' : error.message}</Notice>
  if (!data) return null
  const t = data.transaction
  const names: Record<PartyRole, string> = { seller: t.seller.fullName, buyer: t.buyer.fullName, leader: t.leader.fullName }

  return (
    <div className="page-app">
      <div className="no-print row cert-actions">
        <Link to={`/app/transactions/${t.id}`}>Back to the sale</Link>
        <button type="button" className="button" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      <article className="certificate" aria-label="Land sale certificate">
        <header className="cert-head">
          <LogoMark size={44} />
          <div>
            <p className="cert-kicker">Hati ya Mauzo ya Kiwanja</p>
            <h1>Land Sale Certificate</h1>
          </div>
        </header>
        <p className="cert-statement">
          This certifies that on {formatDate(t.completedAt)}, at plot <strong>{t.plotNumber}</strong> in {t.ward}, {t.district}, {t.region},{' '}
          <strong>{t.seller.fullName}</strong> sold the plot to <strong>{t.buyer.fullName}</strong> for {formatTzs(t.priceTzs)}, in the
          presence of <strong>{t.leader.fullName}</strong>, Mwenyekiti, and that all three signed in that order.
        </p>
        <div className="cert-grid">
          <table className="cert-table">
            <tbody>
              {(['seller', 'buyer', 'leader'] as PartyRole[]).map((r) => (
                <tr key={r}>
                  <th scope="row">{partyLabel[r]}</th>
                  <td>
                    {names[r]}
                    {r !== 'leader' && <span className="cert-sub">NIDA {maskNin(r === 'seller' ? t.seller.nin : t.buyer.nin)}</span>}
                  </td>
                  <td className="mono cert-sig">{t.signatures[r].slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <figure className="cert-qr">
            <img src={data.qrDataUrl} alt="QR code to verify this certificate online" width={168} height={168} />
            <figcaption>Scan to verify</figcaption>
          </figure>
        </div>
        <dl className="cert-meta">
          <div>
            <dt>Sale fingerprint (SHA-256)</dt>
            <dd className="mono cert-hash">{t.transactionHash}</dd>
          </div>
          <div>
            <dt>Certificate number</dt>
            <dd className="mono">{t.id.replace('tx_', '').toUpperCase()}</dd>
          </div>
          <div>
            <dt>Ministry of Lands reference</dt>
            <dd className="mono">{t.ministry?.reference ?? 'Pending submission'}</dd>
          </div>
          <div>
            <dt>Verification link</dt>
            <dd className="cert-url">{data.verificationUrl}</dd>
          </div>
        </dl>
        <p className="cert-foot">
          Issued by the Kiwanja Block pilot. This certificate is evidence of a witnessed sale and does not replace a title deed. Any change to
          the record changes the fingerprint above. Plot fingerprint after sale: <span className="mono">{t.plotHashAfter.slice(0, 16)}</span>.
        </p>
      </article>
    </div>
  )
}
