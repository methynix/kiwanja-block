import type { User } from './types'

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }

  get isNetwork() {
    return this.status === 0
  }
}

interface Session {
  accessToken: string
  user: User
}

let accessToken: string | null = null
let refreshInFlight: Promise<Session | null> | null = null
let onSessionLost: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler
}

const baseHeaders = { 'X-Requested-With': 'kiwanja' }

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`/api${path}`, { credentials: 'same-origin', ...init })
  } catch {
    throw new ApiError(0, 'No connection to the Kiwanja server', 'OFFLINE')
  }
}

async function toError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null)
  const fallback = res.status >= 500 ? 'The server had a problem. Try again shortly.' : `Request failed (${res.status})`
  return new ApiError(res.status, body?.error ?? fallback, body?.code, body?.details)
}

export function refreshSession(): Promise<Session | null> {
  refreshInFlight ??= (async () => {
    try {
      const res = await send('/auth/refresh', { method: 'POST', headers: baseHeaders })
      if (res.status === 204) {
        accessToken = null
        return null
      }
      if (!res.ok) {
        if (res.status === 401) accessToken = null
        if (res.status >= 500) throw await toError(res)
        return null
      }
      const session = (await res.json()) as Session
      accessToken = session.accessToken
      return session
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
}

async function authorized(path: string, init: RequestInit, auth: boolean): Promise<Response> {
  const withToken = (): RequestInit => ({
    ...init,
    headers: { ...baseHeaders, ...(init.headers ?? {}), ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  })

  if (auth && !accessToken) await refreshSession()
  let res = await send(path, withToken())
  if (auth && res.status === 401) {
    const session = await refreshSession()
    if (!session) {
      onSessionLost?.()
      throw await toError(res)
    }
    res = await send(path, withToken())
  }
  return res
}

export async function api<T>(path: string, { method = 'GET', body, auth = true }: RequestOptions = {}): Promise<T> {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  const res = await authorized(path, init, auth)
  if (!res.ok) throw await toError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function apiBlob(path: string): Promise<Blob> {
  const res = await authorized(path, { method: 'GET' }, true)
  if (!res.ok) throw await toError(res)
  return res.blob()
}

export async function login(phone: string, password: string): Promise<Session> {
  const session = await api<Session>('/auth/login', { method: 'POST', body: { phone, password }, auth: false })
  accessToken = session.accessToken
  return session
}

export async function logout(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST', auth: false })
  } finally {
    accessToken = null
  }
}
