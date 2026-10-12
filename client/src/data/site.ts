export const contact = {
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) ?? '',
  office: 'Pilot run with the eGA Research, Innovation and Development Centre, Dodoma',
}

export const publicNav = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/verify', label: 'Check a plot' },
]

export const legalNav = [
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms of use' },
  { to: '/cookies', label: 'Cookie policy' },
]

export const sealSteps = [
  {
    title: 'Scan the plot where it stands',
    body: 'Every registered plot carries a QR code tied to its record. The Mwenyekiti scans it on site, so the sale starts from the plot that actually exists, not from a photocopy.',
  },
  {
    title: 'The seller signs first',
    body: 'The app checks the seller is the owner on record right now. The seller agrees to the price, is photographed, and the phone records where everyone is standing.',
  },
  {
    title: 'The buyer signs second',
    body: 'The buyer’s name is checked against their NIDA number. Their photo and position become part of the signature, so neither can be swapped later.',
  },
  {
    title: 'The Mwenyekiti signs last',
    body: 'Only after both parties have signed can the local leader witness the sale. Their signature closes the handshake.',
  },
  {
    title: 'The record is sealed',
    body: 'A SHA-256 fingerprint covers the plot, the price, the three people, their photos and locations. Ownership moves to the buyer and the plot’s old QR code is marked as superseded.',
  },
]

export const audiences = [
  {
    who: 'Wenyeviti wa Mtaa',
    what: 'Record sales at the plot, even with no signal, and keep a ward register that answers questions before they become accusations.',
  },
  {
    who: 'Buyers and sellers',
    what: 'Get a certificate with a QR code anyone can check, and see the plots and sales recorded against your NIDA number.',
  },
  {
    who: 'Land officers',
    what: 'See sales across wards, review records flagged for location, and forward completed transfers to the Ministry of Lands.',
  },
  {
    who: 'Courts and banks',
    what: 'Scan a certificate to confirm it matches the sealed record, without seeing anyone’s NIN or the price.',
  },
]

export const offlineTimeline = [
  { time: '10:05', text: 'Mwenyekiti opens Kiwanja Block at the plot. No network.' },
  { time: '10:07', text: 'Plot KK-014 is scanned from the copy saved on the phone that morning.' },
  { time: '10:21', text: 'Seller, buyer and Mwenyekiti sign. The phone shows a receipt fingerprint.' },
  { time: '13:40', text: 'Back in town, the phone reconnects and uploads the handshake by itself.' },
  { time: '13:40', text: 'The server re-checks every signature, NIDA and current ownership, then seals the sale.' },
]
