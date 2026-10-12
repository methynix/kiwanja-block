import { Link } from 'react-router'
import { useTitle } from '../../hooks/useTitle'

export function NotFoundPage() {
  useTitle('Page not found')
  return (
    <div className="container page narrow">
      <h1>This page is not on the map</h1>
      <p className="lead">The link may be old, or mistyped.</p>
      <p className="row">
        <Link to="/" className="button">
          Go to the home page
        </Link>
        <Link to="/verify" className="button button-secondary">
          Check a plot
        </Link>
      </p>
    </div>
  )
}
