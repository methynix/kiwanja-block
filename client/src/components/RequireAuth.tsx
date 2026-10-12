import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../lib/types'
import { Loading } from './ui'

export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <Loading label="Opening your workspace" />
  if (status === 'signed-out' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />
  return <Outlet />
}
