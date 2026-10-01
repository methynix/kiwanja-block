import { useEffect, useState, type FormEvent } from 'react'
import { verifyNin, type NidaCitizen } from './lib/api'
import {
  createLandRecord,
  listLandRecords,
  localDb,
  startSync,
  verifyLandRecord,
  type LandRecord,
  type SyncState,
} from './lib/db'

function App() {
  const [syncState, setSyncState] = useState<SyncState>(navigator.onLine ? 'syncing' : 'offline')
  const [records, setRecords] = useState<LandRecord[]>([])
  const [integrity, setIntegrity] = useState<Record<string, boolean>>({})

  const [nin, setNin] = useState('')
  const [citizen, setCitizen] = useState<NidaCitizen | null>(null)
  const [plotNumber, setPlotNumber] = useState('')
  const [location, setLocation] = useState('')
  const [areaSqm, setAreaSqm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => startSync(setSyncState), [])

  useEffect(() => {
    const refresh = async () => {
      const docs = await listLandRecords()
      setRecords(docs)
      const checks = await Promise.all(docs.map(async (d) => [d._id, await verifyLandRecord(d)] as const))
      setIntegrity(Object.fromEntries(checks))
    }
    void refresh()
    const changes = localDb.changes({ since: 'now', live: true }).on('change', refresh)
    return () => changes.cancel()
  }, [])

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCitizen(null)
    try {
      setCitizen(await verifyNin(nin))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    if (!citizen) return
    setError(null)
    try {
      await createLandRecord({
        plotNumber: plotNumber.trim(),
        ownerNin: citizen.nin,
        ownerName: [citizen.firstName, citizen.middleName, citizen.lastName].join(' '),
        location: location.trim(),
        areaSqm: Number(areaSqm),
      })
      setPlotNumber('')
      setLocation('')
      setAreaSqm('')
    } catch (err) {
      setError((err as Error).name === 'conflict' ? 'That plot number is already registered' : (err as Error).message)
    }
  }

  return (
    <main>
      <header>
        <h1>Kiwanja Block</h1>
        <span className={`badge ${syncState}`}>{syncState}</span>
      </header>

      <section>
        <h2>1. Verify owner (NIDA)</h2>
        <form onSubmit={handleVerify}>
          <input value={nin} onChange={(e) => setNin(e.target.value)} placeholder="NIN e.g. 19850412-11111-00001-21" required />
          <button type="submit">Verify</button>
        </form>
        {citizen && (
          <p className="ok">
            ✓ {citizen.firstName} {citizen.middleName} {citizen.lastName} — {citizen.district}, {citizen.region}
          </p>
        )}
      </section>

      <section>
        <h2>2. Register plot</h2>
        <form onSubmit={handleRegister}>
          <input value={plotNumber} onChange={(e) => setPlotNumber(e.target.value)} placeholder="Plot number" required />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" required />
          <input value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} placeholder="Area (m²)" type="number" min="1" required />
          <button type="submit" disabled={!citizen}>Save</button>
        </form>
        {!citizen && <p className="muted">Verify an owner first. Records save locally and sync when online.</p>}
      </section>

      {error && <p className="error">{error}</p>}

      <section>
        <h2>Records ({records.length})</h2>
        <ul>
          {records.map((r) => (
            <li key={r._id}>
              <strong>{r.plotNumber}</strong> · {r.ownerName} · {r.location} · {r.areaSqm} m²
              <br />
              <code title={r.hash}>{r.hash.slice(0, 16)}…</code>{' '}
              {integrity[r._id] === false ? <span className="error">tampered</span> : <span className="ok">hash ok</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
