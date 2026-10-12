import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Field, Notice } from '../../components/ui'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { useTitle } from '../../hooks/useTitle'

interface FieldErrors {
  fieldErrors?: Record<string, string[]>
}

export function RegisterPage() {
  useTitle('Create a citizen account')
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', nin: '', dateOfBirth: '', phone: '+255', password: '' })
  const [accept, setAccept] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const local: Record<string, string> = {}
    if (!/^\d{20}$/.test(form.nin)) local.nin = 'Enter the 20 digits of your NIDA number, without dashes'
    if (form.password.length < 10) local.password = 'Use at least 10 characters'
    if (!accept) local.acceptTerms = 'You need to accept the terms and privacy policy'
    setErrors(local)
    if (Object.keys(local).length) return

    setBusy(true)
    try {
      await api('/auth/register', { method: 'POST', auth: false, body: { ...form, acceptTerms: true } })
      await signIn(form.phone, form.password)
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = (err.details as FieldErrors | undefined)?.fieldErrors ?? {}
        setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v[0]])))
        setError(err.isNetwork ? 'You are offline. Creating an account needs a connection.' : err.message)
      } else {
        setError((err as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page auth-page">
      <div className="auth-card auth-card-wide">
        <h1>Create a citizen account</h1>
        <p className="muted">
          See the plots registered to your NIDA number and download certificates for sales you took part in. Your details are
          checked against NIDA. Your date of birth is used for that check only and is not stored.
        </p>
        {error && (
          <Notice tone="bad" live>
            <p>{error}</p>
          </Notice>
        )}
        <form onSubmit={submit} noValidate>
          <Field label="Full name, as on your NIDA card" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} required />
          <div className="field-pair">
            <Field label="NIDA number" hint="20 digits" inputMode="numeric" value={form.nin} onChange={set('nin')} error={errors.nin} maxLength={20} required />
            <Field label="Date of birth" type="date" autoComplete="bday" value={form.dateOfBirth} onChange={set('dateOfBirth')} error={errors.dateOfBirth} required />
          </div>
          <Field label="Phone number" hint="You will sign in with this" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set('phone')} error={errors.phone} required />
          <Field label="Password" hint="At least 10 characters" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} required />
          <div className={`check ${errors.acceptTerms ? 'has-error' : ''}`}>
            <input id="accept" type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} aria-describedby={errors.acceptTerms ? 'accept-error' : undefined} />
            <label htmlFor="accept">
              I have read the <Link to="/terms">terms of use</Link> and the <Link to="/privacy">privacy policy</Link>, and I agree to my name and NIDA number being checked against NIDA.
            </label>
          </div>
          {errors.acceptTerms && (
            <p id="accept-error" className="field-error">
              {errors.acceptTerms}
            </p>
          )}
          <button type="submit" className="button button-block" disabled={busy}>
            {busy ? 'Checking with NIDA' : 'Create account'}
          </button>
        </form>
        <p className="muted auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
