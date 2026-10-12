import { Link } from 'react-router'
import { useTitle } from '../../hooks/useTitle'

const checks = [
  ['The plot exists and is active', 'The sale must start from a plot in the register, scanned or picked from the ward list.'],
  ['The seller owns it now', 'Checked on the phone when the sale starts, and again on the server when it arrives. If ownership moved in between, the sale is refused.'],
  ['The buyer is a real person', 'The buyer’s name must match their NIDA number exactly.'],
  ['The order of signatures', 'Seller first, buyer second, Mwenyekiti last. Times that go backwards are refused.'],
  ['The right Mwenyekiti', 'Only a Mwenyekiti of the plot’s ward can witness a sale there.'],
  ['Nothing changed on the way', 'Each signature is recomputed from the photos, locations and times. A single changed pixel or digit breaks it.'],
  ['Where people stood', 'Locations are compared with the plot’s surveyed point. Signing far from the plot is not refused, but it is flagged for the land officer.'],
]

export function HowItWorksPage() {
  useTitle('How it works')
  return (
    <div className="container page">
      <header className="page-head">
        <h1>How it works</h1>
        <p className="lead">
          For buyers, leaders and the engineers who will be asked hard questions about it. Everything below is what the system
          actually does today.
        </p>
      </header>

      <section className="split section-tight" aria-labelledby="fp-heading">
        <h2 id="fp-heading">The fingerprint</h2>
        <div className="prose">
          <p>
            Each person’s signature is a SHA-256 hash of the sale terms, their role, their identity, the hash of their photo, their
            location and the exact time they signed. The sale fingerprint is a hash of the terms and all three signatures together.
          </p>
          <pre className="code-block" aria-label="Signature formula">
            {`signature = SHA-256( terms | role | identity | photo hash, location, time )
fingerprint = SHA-256( terms | seller | buyer | mwenyekiti )`}
          </pre>
          <p>
            The phone computes the same values the server does, using the same canonical ordering of fields. That is how a sale
            recorded offline can be proven unchanged when it finally uploads.
          </p>
        </div>
      </section>

      <section className="section-tight" aria-labelledby="checks-heading">
        <h2 id="checks-heading">What is checked before a sale is accepted</h2>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Check</th>
              <th scope="col">How</th>
            </tr>
          </thead>
          <tbody>
            {checks.map(([what, how]) => (
              <tr key={what}>
                <th scope="row">{what}</th>
                <td>{how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="split section-tight" aria-labelledby="qr-heading">
        <h2 id="qr-heading">Why an old QR code stops working</h2>
        <div className="prose">
          <p>
            A plot’s QR code contains the plot’s own fingerprint, which covers its current owner. When the plot is sold, the
            fingerprint changes and the old one is kept as history. Scanning the old code tells you plainly that the plot has
            changed hands since that code was printed. That is the moment a second buyer finds out, before paying.
          </p>
        </div>
      </section>

      <section className="split section-tight" aria-labelledby="limits-heading">
        <h2 id="limits-heading">What it does not do yet</h2>
        <ul className="prose list">
          <li>Identity checks use a simulated NIDA service with test citizens.</li>
          <li>Transfers are sent to a simulated Ministry of Lands endpoint that returns a reference number.</li>
          <li>Signatures are hash based. A production version would give each party a private key so the server only verifies.</li>
          <li>A certificate is evidence of a witnessed sale. It is not a title deed.</li>
        </ul>
      </section>

      <p className="section-link">
        <Link to="/verify" className="button">
          Check a plot or certificate
        </Link>
      </p>
    </div>
  )
}
