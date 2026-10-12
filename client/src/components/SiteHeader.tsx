import { Link, NavLink } from 'react-router'
import { Logo } from './Logo'
import { publicNav } from '../data/site'
import { useAuth } from '../hooks/useAuth'

export function SiteHeader() {
  const { status } = useAuth()
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="brand" aria-label="Kiwanja Block home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="site-nav">
          {publicNav.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
          {status === 'signed-in' ? (
            <Link to="/app" className="button button-small">
              Open workspace
            </Link>
          ) : (
            <Link to="/login" className="button button-small">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
