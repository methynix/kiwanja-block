import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api'
import { cachePlots, getCachedPlots } from '../../lib/local'
import { formatDate, formatNumber, landUseLabel } from '../../lib/format'
import { useAuth } from '../../hooks/useAuth'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { Empty, Loading, Notice } from '../../components/ui'
import type { Plot } from '../../lib/types'

async function loadPlots(role: string | undefined): Promise<{ plots: Plot[]; fromCache: boolean }> {
  try {
    const { plots } = await api<{ plots: Plot[] }>('/plots')
    if (role === 'mwenyekiti') await cachePlots(plots)
    return { plots, fromCache: false }
  } catch (err) {
    const cached = await getCachedPlots()
    if (cached.savedAt) return { plots: cached.plots, fromCache: true }
    throw err
  }
}

export function PlotsPage() {
  useTitle('Plots')
  const { user } = useAuth()
  const { data, error, loading } = useResource(() => loadPlots(user?.role), user?.role ?? 'none')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!data) return []
    if (!q) return data.plots
    return data.plots.filter((p) => [p.plotNumber, p.ownerName, p.ward].some((v) => v.toLowerCase().includes(q)))
  }, [data, query])

  return (
    <div className="page-app">
      <header className="page-head page-head-row">
        <div>
          <h1>Plots</h1>
          <p className="muted">{user?.role === 'mwenyekiti' ? `Registered plots in ${user.ward}` : 'Registered plots in all wards'}</p>
        </div>
        <Link to="/app/plots/new" className="button">
          Register a plot
        </Link>
      </header>
      {data?.fromCache && (
        <Notice tone="info" title="Showing the copy saved on this phone">
          <p>You are offline. The list updates when you reconnect.</p>
        </Notice>
      )}
      <div className="field search">
        <label htmlFor="plot-search">Search by plot number, owner or ward</label>
        <input id="plot-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {loading && <Loading label="Loading plots" />}
      {error && !data && <Notice tone="bad" live>{error.message}</Notice>}
      {data && filtered.length === 0 && <Empty title={query ? 'No plot matches that search' : 'No plots registered yet'} />}
      {filtered.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Plot</th>
                <th scope="col">Ward</th>
                <th scope="col">Owner</th>
                <th scope="col">Size</th>
                <th scope="col">Use</th>
                <th scope="col">Owner since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <th scope="row">
                    <Link to={`/app/plots/${p.id}`}>{p.plotNumber}</Link>
                  </th>
                  <td>{p.ward}</td>
                  <td>{p.ownerName}</td>
                  <td className="num">{formatNumber(p.sizeSqm)} m²</td>
                  <td>{landUseLabel[p.landUse]}</td>
                  <td>{formatDate(p.ownerSince)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
