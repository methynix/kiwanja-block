interface LogoProps {
  withWordmark?: boolean
  size?: number
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img src="/favicon.svg" width={Math.round(size * 0.9)} height={size} alt="" aria-hidden="true" className="logo-mark" />
  )
}

export function Logo({ withWordmark = true, size = 32 }: LogoProps) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="logo-word">
          Kiwanja<span className="logo-word-accent">Block</span>
        </span>
      )}
    </span>
  )
}
