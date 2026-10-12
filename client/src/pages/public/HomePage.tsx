import { Link } from 'react-router'
import { ParcelMap } from '../../components/ParcelMap'
import { audiences, offlineTimeline, sealSteps } from '../../data/site'
import { useTitle } from '../../hooks/useTitle'

export function HomePage() {
  useTitle('')
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>
              A plot can only be sold <span className="underline-soil">once.</span>
            </h1>
            <p className="lead">
              Kiwanja Block records a land sale at the plot itself. The seller, the buyer and the Mwenyekiti each sign on one phone,
              and the sale is sealed so it cannot be quietly changed or sold again. It keeps working where the network does not.
            </p>
            <div className="hero-actions">
              <Link to="/verify" className="button button-large">
                Check a plot before you pay
              </Link>
              <Link to="/login" className="button button-large button-secondary">
                Mwenyekiti sign in
              </Link>
            </div>
            <p className="hero-note">
              Have a certificate or a plot QR code? Scanning it shows whether it matches the sealed record today.
            </p>
          </div>
          <ParcelMap />
        </div>
      </section>

      <section className="band band-soil" aria-labelledby="problem-heading">
        <div className="container split">
          <h2 id="problem-heading">One title deed, three buyers, one weekend.</h2>
          <div className="prose">
            <p>
              Most land in Tanzania changes hands on the street, on paper, with the Mwenyekiti as witness. Nothing connects that
              paper to the next sale. A seller can take the same plot to three buyers between Friday and Sunday, collect three
              payments and be gone by Monday.
            </p>
            <p>
              The Ministry of Lands only finds out when the buyers arrive to register, one after another, each holding a genuine
              looking agreement. By then the money has left. Kiwanja Block moves the check to the moment and the place of the sale.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="seal-heading">
        <div className="container">
          <div className="section-head">
            <h2 id="seal-heading">How a sale is sealed</h2>
            <p className="muted">The order matters. The app will not let the Mwenyekiti sign before both parties have.</p>
          </div>
          <ol className="ledger">
            {sealSteps.map((step, i) => (
              <li key={step.title} className="ledger-row">
                <span className="ledger-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="section-link">
            <Link to="/how-it-works">Read what is checked, and what the fingerprint covers</Link>
          </p>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="offline-heading">
        <div className="container split">
          <div>
            <h2 id="offline-heading">No signal at the plot is normal. It is not a problem.</h2>
            <p className="lead-small">
              The Mwenyekiti saves the ward’s plots to the phone while in town. At the plot, the whole handshake happens offline
              and the phone keeps it in a queue. When the network returns, the sale uploads on its own and the server checks it
              again from scratch, including whether the plot was sold to someone else in the meantime.
            </p>
          </div>
          <ol className="timeline" aria-label="Example of an offline sale">
            {offlineTimeline.map((t) => (
              <li key={t.time + t.text}>
                <time className="mono">{t.time}</time>
                <span>{t.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="who-heading">
        <div className="container">
          <h2 id="who-heading">Who it is for</h2>
          <dl className="audience">
            {audiences.map((a) => (
              <div key={a.who} className="audience-row">
                <dt>{a.who}</dt>
                <dd>{a.what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="cta-band" aria-labelledby="cta-heading">
        <div className="container cta-inner">
          <div>
            <h2 id="cta-heading">Buying a plot this week?</h2>
            <p>Ask the seller for the plot’s QR code and check it here before any money moves.</p>
          </div>
          <Link to="/verify" className="button button-large button-light">
            Check a plot
          </Link>
        </div>
      </section>
    </>
  )
}
