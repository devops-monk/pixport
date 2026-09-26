import clsx from 'clsx'

export function ProgressRing({ value, size = 44, className }: { value: number | null; size?: number; className?: string }) {
  const r = (size - 5) / 2
  const c = 2 * Math.PI * r
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={clsx(value === null && 'animate-spin', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value === null ? undefined : Math.round(value * 100)}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3.5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={value === null ? c * 0.7 : c * (1 - Math.max(0.02, value))}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
    </svg>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <ProgressRing value={null} size={18} className={className} />
}
