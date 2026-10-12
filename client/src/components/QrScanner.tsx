import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

interface QrScannerProps {
  onResult: (text: string) => void
  onClose: () => void
}

export function QrScanner({ onResult, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const [error, setError] = useState<string | null>(supported ? null : 'This browser cannot use the camera. Pick the plot from the list instead.')

  useEffect(() => {
    if (!supported) return
    let stream: MediaStream | null = null
    let frame = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const tick = () => {
      const video = videoRef.current
      if (stopped || !video || !ctx) return
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })
        if (code?.data) {
          stopped = true
          onResult(code.data)
          return
        }
      }
      frame = requestAnimationFrame(tick)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        stream = s
        if (stopped) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = s
        void video.play()
        frame = requestAnimationFrame(tick)
      })
      .catch(() => setError('The camera could not be opened. Allow camera access, or pick the plot from the list instead.'))

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onResult, supported])

  return (
    <div className="scanner">
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : (
        <div className="scanner-view">
          <video ref={videoRef} muted playsInline aria-label="Camera view for scanning the plot QR code" />
          <span className="scanner-target" aria-hidden="true" />
        </div>
      )}
      <button type="button" className="button button-secondary" onClick={onClose}>
        Close camera
      </button>
    </div>
  )
}

