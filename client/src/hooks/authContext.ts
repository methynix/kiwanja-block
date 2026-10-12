import { createContext } from 'react'
import type { User } from '../lib/types'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

export interface AuthValue {
  user: User | null
  status: AuthStatus
  offlineSession: boolean
  signIn: (phone: string, password: string) => Promise<User>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
