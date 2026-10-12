import type { Plot, Presence, Role } from './types'

const tzs = new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('en-TZ')
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const formatTzs = (value: number) => tzs.format(value)
export const formatNumber = (value: number) => number.format(value)
export const formatDate = (iso: string) => date.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const shortHash = (hash: string) => `${hash.slice(0, 8)}…${hash.slice(-6)}`
export const formatGps = (gps: { lat: number; lng: number }) => `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`
export const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ')

export const landUseLabel: Record<Plot['landUse'], string> = {
  residential: 'Residential',
  agricultural: 'Agricultural',
  mixed: 'Mixed use',
}

export const roleLabel: Record<Role, string> = {
  citizen: 'Citizen',
  mwenyekiti: 'Mwenyekiti',
  officer: 'Land officer',
}

export const partyLabel = { seller: 'Seller', buyer: 'Buyer', leader: 'Mwenyekiti' } as const

export const presenceLabel: Record<Presence, string> = {
  verified: 'At the plot',
  far: 'Away from the plot',
  no_gps: 'No location captured',
  plot_has_no_gps: 'Plot has no surveyed point',
}

export function maskNin(nin: string) {
  return `${nin.slice(0, 4)} •••• •••• ${nin.slice(-4)}`
}
