import { useState, type ChangeEvent, type FormEvent } from 'react'
import { api, ApiError } from '../../lib/api'
import { roleLabel } from '../../lib/format'
import { useResource } from '../../hooks/useResource'
import { useTitle } from '../../hooks/useTitle'
import { Field, Loading, Notice, SelectField } from '../../components/ui'
import type { User } from '../../lib/types'

const blank = { fullName: '', phone: '+255', password: '', role: 'mwenyekiti', ward: '', district: '', region: 'Dodoma' }

export function StaffPage() {
  useTitle('Staff accounts')
  const staff = useResource(() => api<{ staff: User[] }>('/auth/staff'), 'staff')
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    setErrors({})
    try {
      const { user } = await api<{ user: User }>('/auth/staff', { method: 'POST', body: form })
      setMessage({ tone: 'ok', text: `${user.fullName} can now sign in as ${roleLabel[user.role]}. Share the temporary password in person.` })
      setForm(blank)
      staff.reload()
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = (err.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors ?? {}
        setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])))
      }
      setMessage({ tone: 'bad', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-app">
      <header className="page-head">
        <h1>Staff accounts</h1>
        <p className="muted">Wenyeviti and land officers cannot sign themselves up. Their accounts are created here.</p>
      </header>
      <div className="detail-grid">
        <section className="panel" aria-labelledby="new-staff">
          <h2 id="new-staff">Add a staff member</h2>
          {message && (
            <Notice tone={message.tone} live>
              <p>{message.text}</p>
            </Notice>
          )}
          <form onSubmit={submit} className="stack" noValidate>
            <Field label="Full name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} required />
            <SelectField
              label="Role"
              value={form.role}
              onChange={set('role')}
              options={[
                { value: 'mwenyekiti', label: 'Mwenyekiti' },
                { value: 'officer', label: 'Land officer' },
              ]}
            />
            <Field label="Phone number" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone} required />
            <Field label="Temporary password" hint="At least 10 characters" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} required />
            <Field label="Ward (mtaa) or office" value={form.ward} onChange={set('ward')} error={errors.ward} required />
            <div className="field-pair">
              <Field label="District" value={form.district} onChange={set('district')} error={errors.district} required />
              <Field label="Region" value={form.region} onChange={set('region')} error={errors.region} required />
            </div>
            <button type="submit" className="button" disabled={busy}>
              {busy ? 'Creating' : 'Create account'}
            </button>
          </form>
        </section>
        <section aria-labelledby="staff-list">
          <h2 id="staff-list">Current staff</h2>
          {staff.loading && <Loading />}
          {staff.error && <Notice tone="bad">{staff.error.message}</Notice>}
          {staff.data && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Role</th>
                    <th scope="col">Ward</th>
                    <th scope="col">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.data.staff.map((s) => (
                    <tr key={s.id}>
                      <th scope="row">{s.fullName}</th>
                      <td>{roleLabel[s.role]}</td>
                      <td>{s.ward}</td>
                      <td className="mono">{s.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
