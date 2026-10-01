export interface NidaCitizen {
  nin: string
  firstName: string
  middleName: string
  lastName: string
  sex: 'M' | 'F'
  dateOfBirth: string
  region: string
  district: string
}

export async function verifyNin(nin: string): Promise<NidaCitizen> {
  const res = await fetch(`/api/nida/verify/${encodeURIComponent(nin)}`)
  if (!res.ok) throw new Error(res.status === 404 ? 'NIN not found in NIDA' : `NIDA lookup failed (${res.status})`)
  return res.json()
}
