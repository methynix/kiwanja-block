import { useState } from 'react'
import { currentPosition } from '../lib/media'
import { formatGps } from '../lib/format'
import type { Gps } from '../lib/types'
import { Icon } from './Icon'

interface GpsCaptureProps {
  value: Gps | null
  onChange: (gps: Gps | null) => void
  allowSkip?: boolean
  skipped?: boolean
  onSkip?: () => void
}

export function GpsCapture({ value, onChange, allowSkip, skipped, onSkip }: GpsCaptureProps) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const locate = async () => {
    setBusy(true)
    setError(null)
    try {
      onChange(await currentPosition())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gps" aria-live="polite">
      <p className="gps-reading">
        <Icon name="pin" />
        {value ? (
          <span>
            <span className="mono">{formatGps(value)}</span>
            {value.accuracyM !== undefined && <span className="muted"> ± {value.accuracyM} m</span>}
          </span>
        ) : skipped ? (
          <span>Location skipped. The record will be flagged for review.</span>
        ) : (
          <span className="muted">No location captured</span>
        )}
      </p>
      <div className="row">
        <button type="button" className="button button-secondary" onClick={locate} disabled={busy}>
          {busy ? 'Finding location' : value ? 'Capture again' : 'Capture location'}
        </button>
        {allowSkip && !value && !skipped && (
          <button type="button" className="link-button" onClick={onSkip}>
            No GPS signal, continue without
          </button>
        )}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
