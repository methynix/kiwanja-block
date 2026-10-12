import { Link } from 'react-router'
import { formatDate, formatTzs } from '../lib/format'
import type { Transaction } from '../lib/types'
import { Pill } from './ui'

const flagged = (t: Transaction) => Object.values(t.evidence).some((e) => e.presence === 'far' || e.presence === 'no_gps')

export function TransactionTable({ transactions, showWard = false }: { transactions: Transaction[]; showWard?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Plot</th>
            {showWard && <th scope="col">Ward</th>}
            <th scope="col">Seller to buyer</th>
            <th scope="col">Price</th>
            <th scope="col">Sealed</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <th scope="row">
                <Link to={`/app/transactions/${t.id}`}>{t.plotNumber}</Link>
              </th>
              {showWard && <td>{t.ward}</td>}
              <td>
                {t.seller.fullName} <span aria-label="to">→</span> {t.buyer.fullName}
              </td>
              <td className="num">{formatTzs(t.priceTzs)}</td>
              <td>{formatDate(t.completedAt)}</td>
              <td className="pills">
                {t.ministry ? <Pill tone="ok">At Ministry</Pill> : <Pill tone="muted">Sealed</Pill>}
                {flagged(t) && <Pill tone="warn">Location flag</Pill>}
                {t.capturedOffline && <Pill tone="info">Offline capture</Pill>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
