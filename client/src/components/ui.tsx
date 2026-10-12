import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Icon } from './Icon'
import { shortHash } from '../lib/format'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: ReactNode
  error?: string
}

export function Field({ label, hint, error, id, className, ...input }: FieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={fieldId}>{label}</label>
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      <input id={fieldId} aria-invalid={error ? true : undefined} aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined} {...input} />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
}

export function SelectField({ label, options, id, ...select }: SelectFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <select id={fieldId} {...select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

type Tone = 'info' | 'ok' | 'warn' | 'bad'

export function Notice({ tone = 'info', title, children, live = false }: { tone?: Tone; title?: string; children?: ReactNode; live?: boolean }) {
  const icon = tone === 'ok' ? 'check' : tone === 'bad' ? 'cross' : tone === 'warn' ? 'alert' : null
  return (
    <div className={`notice notice-${tone}`} role={live ? (tone === 'bad' ? 'alert' : 'status') : undefined}>
      {icon && <Icon name={icon} size={20} />}
      <div>
        {title && <p className="notice-title">{title}</p>}
        {children && <div className="notice-body">{children}</div>}
      </div>
    </div>
  )
}

export function Pill({ tone = 'info', children }: { tone?: Tone | 'muted'; children: ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

export function HashText({ value, full = false, label = 'SHA-256 fingerprint' }: { value: string; full?: boolean; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }
  return (
    <span className="hash">
      <code className={full ? 'hash-full' : undefined} title={value} aria-label={`${label}: ${value}`}>
        {full ? value : shortHash(value)}
      </code>
      <button type="button" className="link-button" onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Fingerprint copied' : ''}
      </span>
    </span>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <p className="loading" role="status">
      <span className="loading-bar" aria-hidden="true" />
      {label}…
    </p>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  )
}

export function KeyValues({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <div key={k} className="kv-row">
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}
