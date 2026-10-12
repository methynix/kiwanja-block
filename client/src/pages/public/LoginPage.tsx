import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Field, Notice } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { useTitle } from '../../hooks/useTitle'
import { ApiError } from '../../lib/api'

export function LoginPage() {
  useTitle('Sign in')
  const { signIn, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [phone, setPhone] = useState('+255')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'signed-in') return <Navigate to="/app" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(phone, password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from.startsWith('/app') ? from : '/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError && err.isNetwork ? 'You are offline. The first sign in on a phone needs a connection.' : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page auth-page">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="muted">Wenyeviti, land officers and registered citizens.</p>
        {error && (
          <Notice tone="bad" live>
            <p>{error}</p>
          </Notice>
        )}
        <form onSubmit={submit}>
          <Field label="Phone number" type="tel" autoComplete="username" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="button button-block" disabled={busy}>
            {busy ? 'Signing in' : 'Sign in'}
          </button>
        </form>
        <p className="muted auth-switch">
          Buying or selling land? <Link to="/register">Create a citizen account</Link>
        </p>
      </div>
    </div>
  )
}
