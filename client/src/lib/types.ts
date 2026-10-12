export type Role = 'citizen' | 'mwenyekiti' | 'officer'
export type PartyRole = 'seller' | 'buyer' | 'leader'
export type Presence = 'verified' | 'far' | 'no_gps' | 'plot_has_no_gps'

export interface User {
  id: string
  phone: string
  fullName: string
  role: Role
  nin: string | null
  ward: string | null
  district: string | null
  region: string | null
  createdAt: string
}

export interface Gps {
  lat: number
  lng: number
  accuracyM?: number
}

export interface OwnershipEntry {
  ownerName: string
  ownerNin: string
  from: string
  to: string
  transactionId: string
}

export interface Plot {
  id: string
  plotId: string
  status: 'active' | 'inactive'
  plotNumber: string
  ward: string
  district: string
  region: string
  sizeSqm: number
  landUse: 'residential' | 'agricultural' | 'mixed'
  ownerNin: string
  ownerName: string
  gps: Gps | null
  registeredAt: string
  ownerSince: string
  integrityHash: string
  verificationUrl: string
  ownershipHistory: OwnershipEntry[]
  previousHashes: string[]
  lastTransactionId: string | null
}

export interface PartyEvidence {
  signedAt: string
  gps: Gps | null
  photoHash: string
  photoType: string
  presence: Presence
  distanceFromPlotM: number | null
}

export interface MinistrySubmission {
  reference: string
  status: string
  receivedAt: string
  system: string
}

export interface Transaction {
  id: string
  status: 'completed'
  plotId: string
  plotNumber: string
  ward: string
  district: string
  region: string
  plotGps: Gps | null
  priceTzs: number
  currency: 'TZS'
  notes: string | null
  seller: { nin: string; fullName: string }
  buyer: { nin: string; fullName: string }
  leader: { userId: string; fullName: string }
  createdAt: string
  completedAt: string
  receivedAt: string
  capturedOffline: boolean
  evidence: Record<PartyRole, PartyEvidence>
  signatures: Record<PartyRole, string>
  transactionHash: string
  plotHashBefore: string
  plotHashAfter: string
  ministry: MinistrySubmission | null
}

export interface Stats {
  ward: string | null
  plots: number
  transactions: number
  last30Days: number
  valueTzs: number
  awaitingMinistry: number
  submittedToMinistry: number
  presenceFlagged: number
  capturedOffline: number
  recent: Transaction[]
}

export type VerifyState = 'current' | 'superseded' | 'mismatch' | 'tampered' | 'unknown'

export interface PlotVerification {
  found: boolean
  valid: boolean
  state: VerifyState
  plot?: {
    plotNumber: string
    ward: string
    district: string
    region: string
    sizeSqm: number
    landUse: Plot['landUse']
    status: string
    ownerInitials: string
    ownerSince: string
    transfers: number
  }
}

export interface TransactionVerification {
  found: boolean
  valid: boolean
  state: VerifyState
  checks?: Record<PartyRole, { photoIntact: boolean; signatureIntact: boolean; presence: Presence }>
  transaction?: {
    plotNumber: string
    ward: string
    district: string
    region: string
    completedAt: string
    sellerInitials: string
    buyerInitials: string
    leaderName: string
    ministryReference: string | null
  }
}

export interface PartyCapture {
  signedAt: string
  gps: Gps | null
  photo: string
  consent: true
  signature: string
}

export interface HandshakeBundle {
  id: string
  plotId: string
  priceTzs: number
  currency: 'TZS'
  notes?: string
  createdAt: string
  capturedOffline: boolean
  seller: { nin: string; fullName: string }
  buyer: { nin: string; fullName: string }
  evidence: Record<PartyRole, PartyCapture>
}

export type OutboxStatus = 'queued' | 'syncing' | 'accepted' | 'rejected'

export interface OutboxEntry {
  _id: string
  _rev?: string
  status: OutboxStatus
  bundle: HandshakeBundle | null
  plotNumber: string
  ward: string
  sellerName: string
  buyerName: string
  priceTzs: number
  receiptHash: string
  queuedAt: string
  attempts: number
  lastError: string | null
  errorCode: string | null
  transactionHash: string | null
  settledAt: string | null
}
