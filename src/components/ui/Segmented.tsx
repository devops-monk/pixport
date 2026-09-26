import { useId } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'

export interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
}

interface Props<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
  size?: 'sm' | 'md'
}

/** iOS-style segmented control with a sliding selection. */
export function Segmented<T extends string>({ value, options, onChange, label, className, size = 'md' }: Props<T>) {
  const id = useId()
  return (
    <div role="radiogroup" aria-label={label} className={clsx('flex rounded-[10px] bg-surface-2 p-[3px]', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              'relative flex-1 rounded-[8px] px-2 font-medium whitespace-nowrap transition-colors',
              size === 'sm' ? 'h-7 text-[12px]' : 'h-8 text-[13px]',
              active ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[8px] bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.04)] dark:bg-surface-3"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
