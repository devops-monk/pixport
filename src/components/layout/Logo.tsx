export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="var(--accent)" />
      <rect x="16" y="11" width="32" height="42" rx="4" fill="#fff" />
      <ellipse cx="32" cy="28" rx="8" ry="10" fill="var(--accent)" />
      <path d="M19 53c1-8 6-12 13-12s12 4 13 12z" fill="var(--accent)" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.02em]">
      <LogoMark />
      Pixport
    </span>
  )
}
