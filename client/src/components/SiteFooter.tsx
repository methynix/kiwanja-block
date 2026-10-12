import { Link } from 'react-router'
import { Logo } from './Logo'
import { contact, legalNav, publicNav } from '../data/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-grid">
        <div>
          <Logo />
          <p className="muted footer-blurb">
            A pilot land sale register for street level transactions in Tanzania, built during Industrial Practical Training at the
            e-Government Authority.
          </p>
        </div>
        <nav aria-label="Site">
          <p className="footer-heading">Use it</p>
          <ul>
            {publicNav.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/register">Create a citizen account</Link>
            </li>
            <li>
              <Link to="/login">Sign in</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Legal">
          <p className="footer-heading">Legal</p>
          <ul>
            {legalNav.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="footer-heading">Contact</p>
          {contact.email ? (
            <p>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            </p>
          ) : (
            <p>Questions about a sale go to your Mwenyekiti or ward land office.</p>
          )}
          <p className="muted">{contact.office}</p>
        </div>
      </div>
      <div className="container footer-base">
        <p className="muted">Identity checks in this pilot use a simulated NIDA service. Certificates are not yet recognised as title documents.</p>
      </div>
    </footer>
  )
}
