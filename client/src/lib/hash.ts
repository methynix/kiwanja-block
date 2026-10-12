import type { Gps, PartyRole } from './types'

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

export async function sha256(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return toHex(await crypto.subtle.digest('SHA-256', bytes as BufferSource))
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`
}

export interface SigningInput {
  id: string
  plotId: string
  plotNumber: string
  ward: string
  priceTzs: number
  currency: 'TZS'
  seller: { nin: string; fullName: string }
  buyer: { nin: string; fullName: string }
  leader: { userId: string }
  createdAt: string
}

export function buildSigningPayload(tx: SigningInput) {
  return {
    transactionId: tx.id,
    plotId: tx.plotId,
    plotNumber: tx.plotNumber,
    ward: tx.ward,
    priceTzs: tx.priceTzs,
    currency: tx.currency,
    sellerNin: tx.seller.nin,
    sellerName: tx.seller.fullName,
    buyerNin: tx.buyer.nin,
    buyerName: tx.buyer.fullName,
    leaderUserId: tx.leader.userId,
    createdAt: tx.createdAt,
  }
}

export interface Evidence {
  photoHash: string
  gps: Gps | null
  signedAt: string
}

export function computeSignature(payload: object, role: PartyRole, identifier: string, evidence: Evidence) {
  const record = { photoHash: evidence.photoHash, gps: evidence.gps ?? null, signedAt: evidence.signedAt }
  return sha256(`${canonicalize(payload)}|${role}|${identifier}|${canonicalize(record)}`)
}

export function computeTransactionHash(payload: object, signatures: Record<PartyRole, string>) {
  return sha256([canonicalize(payload), signatures.seller, signatures.buyer, signatures.leader].join('|'))
}
