const parcels = [
  'M8 18 92 10 98 74 14 84Z',
  'M92 10 176 4 182 66 98 74Z',
  'M176 4 262 0 268 60 182 66Z',
  'M14 84 98 74 104 152 20 160Z',
  'M182 66 268 60 274 140 188 146Z',
  'M20 160 104 152 110 232 26 238Z',
  'M104 152 188 146 194 226 110 232Z',
  'M188 146 274 140 280 220 194 226Z',
]

const target = 'M98 74 182 66 188 146 104 152Z'

const beacons = [
  { x: 98, y: 74, label: 'Muuzaji', sub: 'seller', dx: -10, anchor: 'end' as const },
  { x: 182, y: 66, label: 'Mnunuzi', sub: 'buyer', dx: 10, anchor: 'start' as const },
  { x: 188, y: 146, label: 'Mwenyekiti', sub: 'witness', dx: 10, anchor: 'start' as const },
]

export function ParcelMap() {
  return (
    <figure className="parcel-map">
      <svg viewBox="-60 -20 400 290" role="img" aria-labelledby="parcel-title parcel-desc">
        <title id="parcel-title">A street block divided into plots</title>
        <desc id="parcel-desc">
          One plot in the middle is highlighted. Three of its corner beacons are marked for the seller, the buyer and
          the Mwenyekiti, who each sign before the sale is sealed.
        </desc>
        <path d="M-40 248 C 60 236, 180 250, 330 238" className="parcel-road" />
        {parcels.map((d) => (
          <path key={d} d={d} className="parcel" />
        ))}
        <path d={target} className="parcel parcel-target" />
        <text x="143" y="104" className="parcel-number" textAnchor="middle">
          KK-014
        </text>
        <text x="143" y="122" className="parcel-meta" textAnchor="middle">
          600 m²
        </text>
        {beacons.map((b, i) => (
          <g key={b.label}>
            <circle cx={b.x} cy={b.y} r="7" className="beacon" />
            <text x={b.x} y={b.y + 3.5} className="beacon-index" textAnchor="middle">
              {i + 1}
            </text>
            <text x={b.x + b.dx} y={b.y - 12} className="beacon-label" textAnchor={b.anchor}>
              {b.label}
            </text>
            <text x={b.x + b.dx} y={b.y - 1} className="beacon-sub" textAnchor={b.anchor}>
              {b.sub}
            </text>
          </g>
        ))}
        <text x="104" y="172" className="parcel-coord">
          −6.18462, 35.75815
        </text>
      </svg>
      <figcaption>Illustration: plot KK-014 and the three beacons that must sign before it can change hands.</figcaption>
    </figure>
  )
}
