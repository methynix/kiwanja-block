import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, ApiError } from '../../lib/api'
import { replaceCachedPlot } from '../../lib/local'
import { cleanName } from '../../lib/format'
import { useAuth } from '../../hooks/useAuth'
import { useOnline } from '../../hooks/useOnline'
import { useTitle } from '../../hooks/useTitle'
import { Field, Notice, SelectField } from '../../components/ui'
import { GpsCapture } from '../../components/GpsCapture'
import type { Gps, Plot } from '../../lib/types'

export function PlotNewPage() {
  useTitle('Register a plot')
  const { user } = useAuth()
  const online = useOnline()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    plotNumber: '',
    ward: user?.role === 'mwenyekiti' ? (user.ward ?? '') : '',
    district: user?.district ?? '',
    region: user?.region ?? '',
    sizeSqm: '',
    landUse: 'residential',
    ownerNin: '',
  })
  const [owner, setOwner] = useState<{ fullName: string } | null>(null)
  const [gps, setGps] = useState<Gps | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ninError, setNinError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [key]: e.target.value })
    if (key === 'ownerNin') setOwner(null)
  }

  const lookup = async () => {
    setNinError(null)
    if (!/^\d{20}$/.test(form.ownerNin)) {
      setNinError('Enter the 20 digit NIDA number')
      return
    }
    try {
      setOwner(await api<{ fullName: string }>(`/nida/lookup/${form.ownerNin}`))
    } catch (err) {
      setNinError((err as Error).message)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!owner) {
      setNinError('Look up the owner in NIDA first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { plot } = await api<{ plot: Plot }>('/plots', {
        method: 'POST',
        body: {
          plotNumber: form.plotNumber.trim(),
          ward: form.ward.trim(),
          district: form.district.trim(),
          region: form.region.trim(),
          sizeSqm: Number(form.sizeSqm),
          landUse: form.landUse,
          ownerNin: form.ownerNin,
          ownerName: cleanName(owner.fullName),
          gps,
        },
      })
      if (user?.role === 'mwenyekiti') await replaceCachedPlot(plot)
      navigate(`/app/plots/${plot.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-app narrow">
      <p className="breadcrumb">
        <Link to="/app/plots">Plots</Link>
      </p>
      <h1>Register a plot</h1>
      {!online && (
        <Notice tone="warn" title="Registration needs a connection">
          <p>New plots are checked against NIDA and the register, so this step is online only.</p>
        </Notice>
      )}
      {error && (
        <Notice tone="bad" live>
          <p>{error}</p>
        </Notice>
      )}
      <form onSubmit={submit} className="stack">
        <fieldset>
          <legend>Plot</legend>
          <div className="field-pair">
            <Field label="Plot number" value={form.plotNumber} onChange={set('plotNumber')} required maxLength={40} />
            <Field label="Size in square metres" type="number" min="1" step="any" inputMode="decimal" value={form.sizeSqm} onChange={set('sizeSqm')} required />
          </div>
          <SelectField
            label="Land use"
            value={form.landUse}
            onChange={set('landUse')}
            options={[
              { value: 'residential', label: 'Residential' },
              { value: 'agricultural', label: 'Agricultural' },
              { value: 'mixed', label: 'Mixed use' },
            ]}
          />
          <div className="field-triple">
            <Field label="Ward (mtaa)" value={form.ward} onChange={set('ward')} readOnly={user?.role === 'mwenyekiti'} required />
            <Field label="District" value={form.district} onChange={set('district')} required />
            <Field label="Region" value={form.region} onChange={set('region')} required />
          </div>
        </fieldset>

        <fieldset>
          <legend>Owner</legend>
          <div className="lookup">
            <Field label="Owner NIDA number" hint="20 digits" inputMode="numeric" maxLength={20} value={form.ownerNin} onChange={set('ownerNin')} error={ninError ?? undefined} required />
            <button type="button" className="button button-secondary" onClick={lookup} disabled={!online}>
              Look up in NIDA
            </button>
          </div>
          {owner && (
            <Notice tone="ok" title="Found in NIDA">
              <p>{owner.fullName}</p>
            </Notice>
          )}
        </fieldset>

        <fieldset>
          <legend>Surveyed point</legend>
          <p className="field-hint">Stand at the plot’s main beacon. Later sales are compared with this point to confirm people signed on site.</p>
          <GpsCapture value={gps} onChange={setGps} />
        </fieldset>

        <button type="submit" className="button button-large" disabled={busy || !online}>
          {busy ? 'Registering' : 'Register plot and create QR label'}
        </button>
      </form>
    </div>
  )
}
