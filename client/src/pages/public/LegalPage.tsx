import { useTitle } from '../../hooks/useTitle'
import type { PolicyDoc } from '../../data/policies'

export function LegalPage({ doc }: { doc: PolicyDoc }) {
  useTitle(doc.title)
  return (
    <article className="container page legal">
      <header className="page-head">
        <h1>{doc.title}</h1>
        <p className="lead">{doc.summary}</p>
        <p className="muted">Last updated {doc.updated}</p>
      </header>
      {doc.sections.map((section) => (
        <section key={section.heading} className="legal-section">
          <h2>{section.heading}</h2>
          {section.paragraphs?.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {section.list && (
            <ul className="list">
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.table && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {section.table.head.map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) =>
                        i === 0 ? (
                          <th key={i} scope="row">
                            {cell}
                          </th>
                        ) : (
                          <td key={i}>{cell}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </article>
  )
}
