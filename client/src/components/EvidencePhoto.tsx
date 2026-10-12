import { useEffect, useState } from 'react'
import { apiBlob } from '../lib/api'

export function EvidencePhoto({ transactionId, role, alt }: { transactionId: string; role: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let url: string | null = null
    let cancelled = false
    apiBlob(`/transactions/${encodeURIComponent(transactionId)}/photos/${role}`)
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [transactionId, role])

  if (failed) return <div className="evidence-photo evidence-missing">Photo unavailable offline</div>
  if (!src) return <div className="evidence-photo evidence-loading" aria-label="Loading photo" />
  return <img className="evidence-photo" src={src} alt={alt} />
}
