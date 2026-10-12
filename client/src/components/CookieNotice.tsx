import { useState } from 'react'
import { Link } from 'react-router'

const KEY = 'kb_cookie_notice_v1'

function readAcknowledged() {
  try {
    return localStorage.getItem(KEY) === 'ok'
  } catch {
    return false
  }
}

export function CookieNotice() {
  const [visible, setVisible] = useState(() => !readAcknowledged())
  if (!visible) return null

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, 'ok')
    } catch {
      return setVisible(false)
    }
    setVisible(false)
  }

  return (
    <section className="cookie-notice" aria-label="Cookie notice">
      <p>
        We set one cookie, and only when you sign in, to keep your session open. No analytics, no advertising, no tracking.{' '}
        <Link to="/cookies">Read the cookie policy</Link>.
      </p>
      <button type="button" className="button button-small" onClick={dismiss}>
        Understood
      </button>
    </section>
  )
}
