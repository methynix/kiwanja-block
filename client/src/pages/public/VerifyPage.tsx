import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { QrScanner } from '../../components/QrScanner'
import { Field } from '../../components/ui'
import { useTitle } from '../../hooks/useTitle'

function routeFromInput(text: string): string | null {
  const trimmed = text.trim()
  try {
    const url = new URL(trimmed)
    const match = /\/verify\/(plot|tx)\/([^/]+)$/.exec(url.pathname)
    const h = url.searchParams.get('h')
    if (match && h) return `/verify/${match[1]}/${match[2]}?h=${encodeURIComponent(h)}`
  } catch {
    return null
  }
  return null
}

export function VerifyPage() {
  useTitle('Check a plot or certificate')
  const navigate = useNavigate()
  const [link, setLink] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const go = useCallback(
    (text: string) => {
      const route = routeFromInput(text)
      if (!route) {
        setError('That is not a Kiwanja Block verification code. Scan the QR code printed on the certificate or plot label.')
        return
      }
      setScanning(false)
      navigate(route)
    },
    [navigate],
  )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    go(link)
  }

  return (
    <div className="container page narrow">
      <header className="page-head">
        <h1>Check a plot or certificate</h1>
        <p className="lead">
          Scan the QR code on a plot label or a land sale certificate. You will see whether it matches the sealed record right now,
          and whether the plot has changed hands since the code was printed.
        </p>
      </header>

      <section className="panel" aria-labelledby="scan-heading">
        <h2 id="scan-heading">Scan with this device</h2>
        {scanning ? (
          <QrScanner onResult={go} onClose={() => setScanning(false)} />
        ) : (
          <button type="button" className="button" onClick={() => setScanning(true)}>
            Open camera
          </button>
        )}
      </section>

      <section className="panel" aria-labelledby="paste-heading">
        <h2 id="paste-heading">Or paste the link</h2>
        <form onSubmit={submit} noValidate>
          <Field
            label="Verification link"
            hint="Your phone’s camera app can read the QR code and show this link."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…/verify/tx/…?h=…"
            error={error ?? undefined}
            inputMode="url"
            autoComplete="off"
            required
          />
          <button type="submit" className="button">
            Check
          </button>
        </form>
      </section>
      <p className="muted">
        This check shows the plot, ward, date and the initials of the people involved. It never shows NIDA numbers, photos or prices.
      </p>
    </div>
  )
}
