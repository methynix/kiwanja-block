const paths = {
  check: 'M4 12.5 9.5 18 20 6.5',
  cross: 'M6 6l12 12M18 6 6 18',
  alert: 'M12 4 22 20H2Z M12 10v4 M12 17h.01',
  pin: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4Z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  qr: 'M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h2v2h-2Z M18 18h2v2h-2Z M14 18h2 M18 14h2',
  cloudOff: 'M3 3l18 18 M7 18h10a4 4 0 0 0 1.5-7.7A6 6 0 0 0 8.6 7.4 M5.2 9.5A4.3 4.3 0 0 0 7 18',
  sync: 'M20 11a8 8 0 0 0-14.3-4.3L4 9 M4 4v5h5 M4 13a8 8 0 0 0 14.3 4.3L20 15 M20 20v-5h-5',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 18, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="icon"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
