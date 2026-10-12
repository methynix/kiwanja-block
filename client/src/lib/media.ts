import type { Gps } from './types'

const MAX_BYTES = 900_000

function base64ToBytes(b64: string) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function dataUrlBytes(dataUrl: string) {
  return base64ToBytes(dataUrl.slice(dataUrl.indexOf(',') + 1))
}

export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo file')
  const bitmap = await createImageBitmap(file)
  let maxSide = 1280
  let quality = 0.82
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser cannot process photos')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (dataUrlBytes(dataUrl).length <= MAX_BYTES) {
      bitmap.close()
      return dataUrl
    }
    maxSide = Math.round(maxSide * 0.8)
    quality = Math.max(0.5, quality - 0.08)
  }
  bitmap.close()
  throw new Error('This photo is too large even after compression. Take a new one.')
}

const round = (value: number, digits: number) => Number(value.toFixed(digits))

export function currentPosition(): Promise<Gps> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This device cannot share its location'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: round(pos.coords.latitude, 6),
          lng: round(pos.coords.longitude, 6),
          accuracyM: Math.round(pos.coords.accuracy),
        }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was refused. Allow location for this site and try again.'
              : 'Could not get a location fix. Move to open sky and try again.',
          ),
        ),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  })
}
