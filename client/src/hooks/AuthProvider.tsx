import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthContext, type AuthStatus } from './authContext'
import * as client from '../lib/api'
import { cacheProfile, clearLocalData, getCachedProfile } from '../lib/local'
import type { User } from '../lib/types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [offlineSession, setOfflineSession] = useState(false)

  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      try {
        const session = await client.refreshSession()
        if (cancelled) return
        if (session) {
          setUser(session.user)
          setOfflineSession(false)
          setStatus('signed-in')
          await cacheProfile(session.user)
          return
        }
        setStatus('signed-out')
      } catch {
        const cached = await getCachedProfile()
        if (cancelled) return
        if (cached) {
          setUser(cached)
          setOfflineSession(true)
          setStatus('signed-in')
        } else {
          setStatus('signed-out')
        }
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    client.setSessionLostHandler(() => {
      if (navigator.onLine) {
        setUser(null)
        setStatus('signed-out')
      }
    })
    return () => client.setSessionLostHandler(null)
  }, [])

  useEffect(() => {
    if (!offlineSession) return
    const tryResume = async () => {
      const session = await client.refreshSession().catch(() => null)
      if (session) {
        setUser(session.user)
        setOfflineSession(false)
      }
    }
    window.addEventListener('online', tryResume)
    return () => window.removeEventListener('online', tryResume)
  }, [offlineSession])

  const signIn = useCallback(async (phone: string, password: string) => {
    const session = await client.login(phone, password)
    const previous = await getCachedProfile()
    if (previous && previous.id !== session.user.id) await clearLocalData()
    await cacheProfile(session.user)
    setUser(session.user)
    setOfflineSession(false)
    setStatus('signed-in')
    return session.user
  }, [])

  const signOut = useCallback(async () => {
    await client.logout().catch(() => undefined)
    await clearLocalData()
    setUser(null)
    setStatus('signed-out')
  }, [])

  const value = useMemo(() => ({ user, status, offlineSession, signIn, signOut }), [user, status, offlineSession, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
