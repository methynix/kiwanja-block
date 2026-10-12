import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../../lib/api'
import { addToOutbox, getCachedPlots, listOutbox, replaceCachedPlot } from '../../lib/local'
import { syncOutbox } from '../../lib/sync'
import { buildSigningPayload, computeSignature, computeTransactionHash, sha256 } from '../../lib/hash'
import { dataUrlBytes } from '../../lib/media'
import { cleanName, formatGps, formatNumber, formatTzs, landUseLabel, maskNin, partyLabel } from '../../lib/format'
import { useAuth } from '../../hooks/useAuth'
import { useOnline } from '../../hooks/useOnline'
import { useTitle } from '../../hooks/useTitle'
import { Field, HashText, KeyValues, Loading, Notice } from '../../components/ui'
import { PhotoCapture } from '../../components/PhotoCapture'
import { GpsCapture } from '../../components/GpsCapture'
import { QrScanner } from '../../components/QrScanner'
import { plotIdFromQr } from '../../lib/qr'
import type { Gps, HandshakeBundle, OutboxEntry, PartyRole, Plot } from '../../lib/types'

type Step = 'plot' | 'terms' | 'seller' | 'buyer' | 'leader' | 'review' | 'done'

interface PartyState {
  photo: string | null
  gps: Gps | null
  gpsSkipped: boolean
  consent: boolean
  signedAt: string | null
  photoHash: string | null
  signature: string | null
}

const emptyParty = (): PartyState => ({ photo: null, gps: null, gpsSkipped: false, consent: false, signedAt: null, photoHash: null, signature: null })

const STEPS: { key: Step; label: string }[] = [
  { key: 'plot', label: 'Plot' },
  { key: 'terms', label: 'Terms' },
  { key: 'seller', label: 'Seller' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'leader', label: 'Mwenyekiti' },
  { key: 'review', label: 'Seal' },
]

function Stepper({ current }: { current: Step }) {
  const index = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="stepper" aria-label="Sale progress">
      {STEPS.map((s, i) => (
        <li key={s.key} className={i < index ? 'is-done' : i === index ? 'is-current' : ''} aria-current={i === index ? 'step' : undefined}>
          <span className="stepper-index">{i + 1}</span>
          <span className="stepper-label">{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

function PlotStep({ onSelect }: { onSelect: (plot: Plot) => void }) {
  const online = useOnline()
  const [params] = useSearchParams()
  const [plots, setPlots] = useState<Plot[] | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const preselect = params.get('plot')

  const choose = useCallback(
    async (plotId: string, list: Plot[] | null = plots) => {
      setError(null)
      const cached = list?.find((p) => p.id === plotId)
      if (!cached && !online) {
        setError('That plot is not saved on this phone, and there is no connection to look it up.')
        return
      }
      setChecking(true)
      try {
        let plot = cached ?? null
        if (online) {
          const fresh = await api<{ plot: Plot }>(`/plots/${encodeURIComponent(plotId)}`).catch(() => null)
          if (fresh) {
            plot = fresh.plot
            await replaceCachedPlot(fresh.plot)
          } else if (!cached) {
            setError('This plot is not in your ward, or it does not exist.')
            return
          }
        }
        if (!plot) return
        if (plot.status !== 'active') {
          setError('This plot is not open for sale.')
          return
        }
        onSelect(plot)
      } finally {
        setChecking(false)
      }
    },
    [plots, online, onSelect],
  )

  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })

  useEffect(() => {
    let cancelled = false
    void getCachedPlots().then(({ plots: p, savedAt: s }) => {
      if (cancelled) return
      setPlots(p)
      setSavedAt(s)
      if (preselect) void chooseRef.current(preselect, p)
    })
    return () => {
      cancelled = true
    }
  }, [preselect])

  const onScan = useCallback(
    (text: string) => {
      setScanning(false)
      const parsed = plotIdFromQr(text)
      if (!parsed) {
        setError('That QR code is not a Kiwanja Block plot label.')
        return
      }
      const cached = plots?.find((p) => p.id === parsed.plotId)
      if (cached && parsed.hash && parsed.hash !== cached.integrityHash) {
        setError('This label is out of date: the plot has changed hands since it was printed. Do not continue with this seller.')
        return
      }
      void choose(parsed.plotId)
    },
    [plots, choose],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (plots ?? []).filter((p) => !q || p.plotNumber.toLowerCase().includes(q) || p.ownerName.toLowerCase().includes(q))
  }, [plots, query])

  return (
    <section aria-labelledby="step-heading">
      <h2 id="step-heading">Which plot is being sold?</h2>
      <p className="muted">Scan the QR label on the plot, or choose it from the plots saved on this phone.</p>
      {error && (
        <Notice tone="bad" live>
          <p>{error}</p>
        </Notice>
      )}
      {checking && <Loading label="Checking the current owner" />}
      <div className="panel">
        {scanning ? (
          <QrScanner onResult={onScan} onClose={() => setScanning(false)} />
        ) : (
          <button type="button" className="button" onClick={() => setScanning(true)}>
            Scan plot QR label
          </button>
        )}
      </div>
      {plots && plots.length === 0 && (
        <Notice tone="warn" title="No plots saved on this phone">
          <p>
            Go to the <Link to="/app">overview</Link> while online and save your ward plots first.
          </p>
        </Notice>
      )}
      {plots && plots.length > 0 && (
        <>
          <div className="field search">
            <label htmlFor="pick-search">Find a plot</label>
            <input id="pick-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Plot number or owner" />
          </div>
          <ul className="pick-list">
            {filtered.map((p) => (
              <li key={p.id}>
                <button type="button" className="pick" onClick={() => void choose(p.id)} disabled={checking}>
                  <span className="pick-number">{p.plotNumber}</span>
                  <span>{p.ownerName}</span>
                  <span className="muted">
                    {formatNumber(p.sizeSqm)} m² · {landUseLabel[p.landUse]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {savedAt && <p className="muted small">Saved on this phone {new Date(savedAt).toLocaleString('en-GB')}</p>}
        </>
      )}
    </section>
  )
}

interface Terms {
  priceTzs: number
  notes: string
  buyer: { nin: string; fullName: string }
  buyerCheck: 'matched' | 'deferred'
}

function TermsStep({ plot, initial, onConfirm }: { plot: Plot; initial: Terms | null; onConfirm: (t: Terms) => void }) {
  const online = useOnline()
  const [price, setPrice] = useState(initial ? String(initial.priceTzs) : '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [nin, setNin] = useState(initial?.buyer.nin ?? '')
  const [name, setName] = useState(initial?.buyer.fullName ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const priceValue = Number(price.replace(/[,\s]/g, ''))
    if (!Number.isInteger(priceValue) || priceValue <= 0) next.price = 'Enter the agreed price in whole shillings'
    if (!/^\d{20}$/.test(nin)) next.nin = 'Enter the buyer’s 20 digit NIDA number'
    if (nin === plot.ownerNin) next.nin = 'The buyer cannot be the current owner'
    if (cleanName(name).length < 3) next.name = 'Enter the buyer’s full name as on the NIDA card'
    setErrors(next)
    if (Object.keys(next).length) return

    const buyer = { nin, fullName: cleanName(name) }
    let buyerCheck: Terms['buyerCheck'] = 'deferred'
    if (online) {
      setBusy(true)
      try {
        const result = await api<{ found: boolean; match: boolean }>('/nida/verify', { method: 'POST', body: buyer })
        if (!result.found) return setErrors({ nin: 'This NIDA number was not found' })
        if (!result.match) return setErrors({ name: 'The name does not match the NIDA record for this number' })
        buyerCheck = 'matched'
      } catch {
        buyerCheck = 'deferred'
      } finally {
        setBusy(false)
      }
    }
    onConfirm({ priceTzs: priceValue, notes: notes.trim(), buyer, buyerCheck })
  }

  return (
    <section aria-labelledby="step-heading">
      <h2 id="step-heading">Agree the terms</h2>
      <KeyValues
        items={[
          ['Plot', `${plot.plotNumber}, ${plot.ward}`],
          ['Seller (owner on record)', `${plot.ownerName} · ${maskNin(plot.ownerNin)}`],
        ]}
      />
      <form onSubmit={submit} noValidate className="stack">
        <Field label="Agreed price in TZS" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} required />
        <fieldset>
          <legend>Buyer</legend>
          <Field label="Buyer NIDA number" hint="20 digits, from the buyer’s NIDA card" inputMode="numeric" maxLength={20} value={nin} onChange={(e) => setNin(e.target.value)} error={errors.nin} required />
          <Field label="Buyer full name, as on the NIDA card" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
        </fieldset>
        <Field label="Notes (optional)" hint="For example, payment arrangement. Up to 500 characters." value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        {!online && (
          <Notice tone="info">
            <p>Offline: the buyer’s NIDA details will be checked when this sale uploads. If they do not match, the sale will be refused.</p>
          </Notice>
        )}
        <button type="submit" className="button button-large" disabled={busy}>
          {busy ? 'Checking buyer with NIDA' : 'Terms agreed, start signing'}
        </button>
      </form>
    </section>
  )
}

interface SignStepProps {
  role: PartyRole
  personName: string
  consentText: string
  state: PartyState
  onChange: (patch: Partial<PartyState>) => void
  onSign: () => Promise<void>
}

function SignStep({ role, personName, consentText, state, onChange, onSign }: SignStepProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const ready = state.consent && state.photo && (state.gps || state.gpsSkipped)

  useEffect(() => headingRef.current?.focus(), [role])

  const sign = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSign()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="step-heading">
      <h2 id="step-heading" ref={headingRef} tabIndex={-1}>
        {partyLabel[role]}: {personName}
      </h2>
      <p className="muted">Hand the phone to {personName.split(' ')[0]} for the consent, then take their photo.</p>
      <div className="sign-grid">
        <div className="stack">
          <div className="check consent">
            <input id={`consent-${role}`} type="checkbox" checked={state.consent} onChange={(e) => onChange({ consent: e.target.checked })} />
            <label htmlFor={`consent-${role}`}>{consentText}</label>
          </div>
          <div>
            <p className="label">Location at signing</p>
            <GpsCapture
              value={state.gps}
              onChange={(gps) => onChange({ gps, gpsSkipped: false })}
              allowSkip
              skipped={state.gpsSkipped}
              onSkip={() => onChange({ gpsSkipped: true })}
            />
          </div>
        </div>
        <div>
          <p className="label">Photo</p>
          <PhotoCapture personLabel={personName} value={state.photo} onChange={(photo) => onChange({ photo })} />
        </div>
      </div>
      {error && (
        <Notice tone="bad" live>
          <p>{error}</p>
        </Notice>
      )}
      <button type="button" className="button button-large" disabled={!ready || busy} onClick={sign}>
        {busy ? 'Signing' : `${partyLabel[role]} signs`}
      </button>
      {!ready && <p className="muted small">Consent, a photo and a location (or a skipped location) are needed before signing.</p>}
    </section>
  )
}

export function HandshakePage() {
  useTitle('Record a sale')
  const { user } = useAuth()
  const online = useOnline()
  const [step, setStep] = useState<Step>('plot')
  const [txId, setTxId] = useState(() => `tx_${crypto.randomUUID()}`)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [plot, setPlot] = useState<Plot | null>(null)
  const [terms, setTerms] = useState<Terms | null>(null)
  const [parties, setParties] = useState<Record<PartyRole, PartyState>>({ seller: emptyParty(), buyer: emptyParty(), leader: emptyParty() })
  const [receipt, setReceipt] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<OutboxEntry | null>(null)
  const [startedOffline, setStartedOffline] = useState(!navigator.onLine)

  const inProgress = step !== 'plot' && step !== 'done'
  useEffect(() => {
    if (!inProgress) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [inProgress])

  useEffect(() => {
    const markOffline = () => setStartedOffline(true)
    window.addEventListener('offline', markOffline)
    return () => window.removeEventListener('offline', markOffline)
  }, [])

  const payload = useMemo(() => {
    if (!plot || !terms || !createdAt || !user) return null
    return buildSigningPayload({
      id: txId,
      plotId: plot.id,
      plotNumber: plot.plotNumber,
      ward: plot.ward,
      priceTzs: terms.priceTzs,
      currency: 'TZS',
      seller: { nin: plot.ownerNin, fullName: plot.ownerName },
      buyer: terms.buyer,
      leader: { userId: user.id },
      createdAt,
    })
  }, [plot, terms, createdAt, user, txId])

  if (!user) return null

  const identifiers: Record<PartyRole, string> = {
    seller: plot?.ownerNin ?? '',
    buyer: terms?.buyer.nin ?? '',
    leader: user.id,
  }

  const patchParty = (role: PartyRole) => (patch: Partial<PartyState>) =>
    setParties((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } }))

  const signParty = (role: PartyRole, next: Step) => async () => {
    if (!payload) throw new Error('Sale terms are missing')
    const state = parties[role]
    if (!state.photo) throw new Error('A photo is required')
    const previous = role === 'buyer' ? parties.seller.signedAt : role === 'leader' ? parties.buyer.signedAt : createdAt
    let signedAt = new Date().toISOString()
    if (previous && signedAt < previous) signedAt = previous
    const photoHash = await sha256(dataUrlBytes(state.photo))
    const gps = state.gps ? { lat: state.gps.lat, lng: state.gps.lng, ...(state.gps.accuracyM !== undefined ? { accuracyM: state.gps.accuracyM } : {}) } : null
    const signature = await computeSignature(payload, role, identifiers[role], { photoHash, gps, signedAt })
    const signed = { ...state, gps, signedAt, photoHash, signature }
    const all = { ...parties, [role]: signed }
    setParties((prev) => ({ ...prev, [role]: signed }))
    if (role === 'leader') {
      setReceipt(await computeTransactionHash(payload, { seller: all.seller.signature!, buyer: all.buyer.signature!, leader: signature }))
    }
    setStep(next)
  }

  const seal = async () => {
    if (!plot || !terms || !createdAt || !receipt) return
    setSubmitting(true)
    const evidence = Object.fromEntries(
      (['seller', 'buyer', 'leader'] as PartyRole[]).map((r) => {
        const p = parties[r]
        return [r, { signedAt: p.signedAt!, gps: p.gps, photo: p.photo!, consent: true as const, signature: p.signature! }]
      }),
    ) as HandshakeBundle['evidence']
    const bundle: HandshakeBundle = {
      id: txId,
      plotId: plot.id,
      priceTzs: terms.priceTzs,
      currency: 'TZS',
      ...(terms.notes ? { notes: terms.notes } : {}),
      createdAt,
      capturedOffline: startedOffline,
      seller: { nin: plot.ownerNin, fullName: plot.ownerName },
      buyer: terms.buyer,
      evidence,
    }
    await addToOutbox({
      _id: txId,
      status: 'queued',
      bundle,
      plotNumber: plot.plotNumber,
      ward: plot.ward,
      sellerName: plot.ownerName,
      buyerName: terms.buyer.fullName,
      priceTzs: terms.priceTzs,
      receiptHash: receipt,
      queuedAt: new Date().toISOString(),
      attempts: 0,
      lastError: null,
      errorCode: null,
      transactionHash: null,
      settledAt: null,
    })
    if (navigator.onLine) await syncOutbox()
    const entry = (await listOutbox()).find((e) => e._id === txId) ?? null
    setOutcome(entry)
    setSubmitting(false)
    setStep('done')
  }

  const restart = () => {
    setTxId(`tx_${crypto.randomUUID()}`)
    setCreatedAt(null)
    setPlot(null)
    setTerms(null)
    setParties({ seller: emptyParty(), buyer: emptyParty(), leader: emptyParty() })
    setReceipt(null)
    setOutcome(null)
    setStartedOffline(!navigator.onLine)
    setStep('plot')
  }

  const cancel = () => {
    if (window.confirm('Cancel this sale? Nothing has been saved yet, and all signatures will be discarded.')) restart()
  }

  const price = terms ? formatTzs(terms.priceTzs) : ''

  return (
    <div className="page-app handshake">
      <header className="page-head page-head-row">
        <div>
          <h1>Record a sale</h1>
          <p className="muted">
            {plot ? `Plot ${plot.plotNumber}, ${plot.ward}` : `Ward ${user.ward}`} · {online ? 'online' : 'offline, will upload later'}
          </p>
        </div>
        {inProgress && (
          <button type="button" className="link-button" onClick={cancel}>
            Cancel sale
          </button>
        )}
      </header>
      {step !== 'done' && <Stepper current={step} />}

      {step === 'plot' && (
        <PlotStep
          onSelect={(p) => {
            setPlot(p)
            setStep('terms')
          }}
        />
      )}

      {step === 'terms' && plot && (
        <>
          <TermsStep
            plot={plot}
            initial={terms}
            onConfirm={(t) => {
              setTerms(t)
              setCreatedAt(new Date().toISOString())
              setStep('seller')
            }}
          />
          <button type="button" className="link-button" onClick={() => setStep('plot')}>
            Choose a different plot
          </button>
        </>
      )}

      {step === 'seller' && plot && terms && (
        <SignStep
          role="seller"
          personName={plot.ownerName}
          consentText={`I, ${plot.ownerName}, agree to sell plot ${plot.plotNumber} to ${terms.buyer.fullName} for ${price}, and agree to my photo and location being recorded with this signature.`}
          state={parties.seller}
          onChange={patchParty('seller')}
          onSign={signParty('seller', 'buyer')}
        />
      )}

      {step === 'buyer' && plot && terms && (
        <SignStep
          role="buyer"
          personName={terms.buyer.fullName}
          consentText={`I, ${terms.buyer.fullName}, agree to buy plot ${plot.plotNumber} from ${plot.ownerName} for ${price}, and agree to my photo and location being recorded with this signature.`}
          state={parties.buyer}
          onChange={patchParty('buyer')}
          onSign={signParty('buyer', 'leader')}
        />
      )}

      {step === 'leader' && plot && terms && (
        <SignStep
          role="leader"
          personName={user.fullName}
          consentText={`I, ${user.fullName}, Mwenyekiti of ${plot.ward}, saw both parties sign at the plot and checked their NIDA cards against the names above.`}
          state={parties.leader}
          onChange={patchParty('leader')}
          onSign={signParty('leader', 'review')}
        />
      )}

      {step === 'review' && plot && terms && receipt && (
        <section aria-labelledby="step-heading">
          <h2 id="step-heading">Seal the sale</h2>
          <KeyValues
            items={[
              ['Plot', `${plot.plotNumber}, ${plot.ward}`],
              ['Seller', plot.ownerName],
              ['Buyer', `${terms.buyer.fullName}${terms.buyerCheck === 'matched' ? ' · NIDA match' : ' · NIDA check on upload'}`],
              ['Price', price],
              ...(['seller', 'buyer', 'leader'] as PartyRole[]).map(
                (r): [string, string] => [
                  `${partyLabel[r]} signed`,
                  `${new Date(parties[r].signedAt!).toLocaleTimeString('en-GB')}${parties[r].gps ? ` at ${formatGps(parties[r].gps!)}` : ', no location'}`,
                ],
              ),
              ['Receipt fingerprint', <HashText key="r" value={receipt} />],
            ]}
          />
          <p className="muted">
            Write the first eight characters of the receipt fingerprint on any paper agreement. The certificate will carry the same value.
          </p>
          <button type="button" className="button button-large" onClick={seal} disabled={submitting}>
            {submitting ? 'Sealing' : online ? 'Seal and upload' : 'Save on this phone and upload later'}
          </button>
        </section>
      )}

      {step === 'done' && outcome && (
        <section aria-labelledby="done-heading" className="done">
          <h2 id="done-heading" className="sr-only">
            Result
          </h2>
          {outcome.status === 'accepted' && (
            <Notice tone="ok" title="Sale sealed" live>
              <p>
                Plot {outcome.plotNumber} now belongs to {outcome.buyerName}. The previous QR label for this plot no longer verifies.
              </p>
              <p className="row">
                <Link to={`/app/transactions/${outcome._id}`} className="button">
                  Open the sale record
                </Link>
                <Link to={`/app/transactions/${outcome._id}/certificate`} className="button button-secondary">
                  Certificate
                </Link>
              </p>
            </Notice>
          )}
          {outcome.status === 'rejected' && (
            <Notice tone="bad" title="The server refused this sale" live>
              <p>{outcome.lastError}</p>
            </Notice>
          )}
          {(outcome.status === 'queued' || outcome.status === 'syncing') && (
            <Notice tone="info" title="Saved on this phone" live>
              <p>
                The sale is safe on this phone and will upload by itself when there is a connection. Keep the app installed and do not
                sign out until it has uploaded.
              </p>
              <p>
                Receipt fingerprint: <HashText value={outcome.receiptHash} />
              </p>
            </Notice>
          )}
          <button type="button" className="button button-secondary" onClick={restart}>
            Record another sale
          </button>
        </section>
      )}
    </div>
  )
}
