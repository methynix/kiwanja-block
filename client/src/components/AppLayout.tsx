import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Logo } from './Logo'
import { Icon } from './Icon'
import { CookieNotice } from './CookieNotice'
import { useAuth } from '../hooks/useAuth'
import { useOnline } from '../hooks/useOnline'
import { useOutbox } from '../hooks/useOutbox'
import { syncOutbox } from '../lib/sync'
import { roleLabel } from '../lib/format'
import type { Role } from '../lib/types'

const navByRole: Record<Role, { to: string; label: string; end?: boolean }[]> = {
  mwenyekiti: [
    { to: '/app', label: 'Overview', end: true },
    { to: '/app/handshake', label: 'Record a sale' },
    { to: '/app/plots', label: 'Plots' },
    { to: '/app/transactions', label: 'Sales register' },
    { to: '/app/sync', label: 'Sync queue' },
  ],
  officer: [
    { to: '/app', label: 'Overview', end: true },
    { to: '/app/plots', label: 'Plots' },
    { to: '/app/transactions', label: 'Sales register' },
    { to: '/app/staff', label: 'Staff accounts' },
  ],
  citizen: [
    { to: '/app', label: 'My land', end: true },
    { to: '/app/transactions', label: 'My certificates' },
  ],
}

function SyncStatus() {
  const online = useOnline()
  const { pending, rejected } = useOutbox()
  const [lastRun, setLastRun] = useState<string | null>(null)

  useEffect(() => {
    if (!online) return
    let cancelled = false
    const run = async () => {
      const result = await syncOutbox()
      if (!cancelled && result.attempted > 0) setLastRun(new Date().toISOString())
    }
    void run()
    const timer = setInterval(run, 20_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [online, pending.length])

  return (
    <Link to="/app/sync" className={`sync-status ${online ? 'is-online' : 'is-offline'}`} aria-live="polite" data-last-run={lastRun ?? undefined}>
      <Icon name={online ? 'sync' : 'cloudOff'} size={16} />
      <span>
        {online ? 'Online' : 'Offline'}
        {pending.length > 0 && ` · ${pending.length} waiting`}
        {rejected.length > 0 && ` · ${rejected.length} refused`}
      </span>
    </Link>
  )
}

export function AppLayout() {
  const { user, signOut, offlineSession } = useAuth()
  const { pending } = useOutbox()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    if (pending.length > 0) {
      const ok = window.confirm(
        `${pending.length} recorded sale(s) have not reached the server yet. Signing out deletes them from this phone. Sign out anyway?`,
      )
      if (!ok) return
    }
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <Link to="/app" className="brand" aria-label="Kiwanja Block workspace">
          <Logo size={28} />
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="app-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          Menu
        </button>
        <nav id="app-nav" aria-label="Workspace" className={`app-nav ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)}>
          {navByRole[user.role].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-user">
          {user.role === 'mwenyekiti' && <SyncStatus />}
          <p className="app-user-name">
            {user.fullName}
            <span className="muted">
              {roleLabel[user.role]}
              {user.ward ? ` · ${user.ward}` : ''}
            </span>
          </p>
          <button type="button" className="link-button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      {offlineSession && (
        <p className="offline-banner" role="status">
          You are working offline with the account saved on this phone. Sales you record will upload when the connection returns.
        </p>
      )}
      <main id="main" tabIndex={-1} className="app-main">
        <Outlet />
      </main>
      <CookieNotice />
    </div>
  )
}
