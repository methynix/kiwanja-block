import { useId, useState, type ChangeEvent } from 'react'
import { compressPhoto } from '../lib/media'
import { Icon } from './Icon'

interface PhotoCaptureProps {
  personLabel: string
  value: string | null
  onChange: (dataUrl: string | null) => void
}

export function PhotoCapture({ personLabel, value, onChange }: PhotoCaptureProps) {
  const id = useId()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      onChange(await compressPhoto(file))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="capture">
      <div className="capture-frame">
        {value ? (
          <img src={value} alt={`Photo of ${personLabel} taken for this signature`} />
        ) : (
          <span className="capture-placeholder">
            <Icon name="camera" size={28} />
            No photo yet
          </span>
        )}
      </div>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={handle} disabled={busy} />
      <label htmlFor={id} className={`button button-secondary ${busy ? 'is-busy' : ''}`}>
        {busy ? 'Processing photo' : value ? 'Retake photo' : `Take photo of ${personLabel}`}
      </label>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
