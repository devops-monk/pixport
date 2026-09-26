import { useId } from 'react'
import clsx from 'clsx'

interface Props {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  /** Centre-zero sliders (e.g. −100…100) show no fill. */
  centered?: boolean
  format?: (v: number) => string
  onChange: (v: number) => void
  onGestureStart?: () => void
  onGestureEnd?: () => void
  resetTo?: number
}

export function Slider({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  centered = min < 0,
  format = (v) => (v > 0 && centered ? `+${v}` : `${v}`),
  onChange,
  onGestureStart,
  onGestureEnd,
  resetTo,
}: Props) {
  const id = useId()
  const fill = ((value - min) / (max - min)) * 100
  const canReset = resetTo !== undefined && value !== resetTo
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] text-ink">
          {label}
        </label>
        <button
          type="button"
          tabIndex={canReset ? 0 : -1}
          onClick={() => canReset && onChange(resetTo!)}
          title={canReset ? 'Reset' : undefined}
          className={clsx(
            'rounded px-1 text-[12px] tabular-nums',
            canReset ? 'text-accent hover:bg-accent-soft' : 'cursor-default text-ink-3',
          )}
        >
          {format(value)}
        </button>
      </div>
      <input
        id={id}
        type="range"
        className={clsx('slider', centered && 'centered')}
        style={{ '--fill': `${fill}%` } as React.CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onGestureStart}
        onPointerUp={onGestureEnd}
        onKeyDown={onGestureStart}
        onKeyUp={onGestureEnd}
        onDoubleClick={() => resetTo !== undefined && onChange(resetTo)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
