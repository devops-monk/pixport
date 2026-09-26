import clsx from 'clsx'

interface Props<T extends string> {
  steps: { id: T; label: string }[]
  current: T
  reachable: (id: T) => boolean
  onSelect: (id: T) => void
}

/** Compact progress indicator for the passport flow; tappable for steps already reached. */
export function Steps<T extends string>({ steps, current, reachable, onSelect }: Props<T>) {
  const idx = steps.findIndex((s) => s.id === current)
  return (
    <nav aria-label="Progress" className="flex items-center justify-center gap-1">
      {steps.map((s, i) => {
        const active = s.id === current
        const done = i < idx
        const can = reachable(s.id)
        return (
          <button
            key={s.id}
            type="button"
            disabled={!can}
            aria-current={active ? 'step' : undefined}
            onClick={() => onSelect(s.id)}
            className={clsx(
              'flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors',
              active ? 'bg-ink text-canvas' : done ? 'text-ink hover:bg-surface-2' : 'text-ink-3',
              !can && 'cursor-default',
            )}
          >
            <span
              className={clsx(
                'flex size-[18px] items-center justify-center rounded-full text-[11px] tabular-nums',
                active ? 'bg-canvas/20' : done ? 'bg-accent text-white' : 'bg-surface-3',
              )}
            >
              {i + 1}
            </span>
            <span className={clsx(!active && 'hidden md:inline')}>{s.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
