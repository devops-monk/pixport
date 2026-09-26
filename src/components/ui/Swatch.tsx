import clsx from 'clsx'
import { Check, Plus } from 'lucide-react'

interface Props {
  color: string
  selected: boolean
  onSelect: () => void
  label: string
}

function isLight(hex: string) {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0'), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 170
}

export function Swatch({ color, selected, onSelect, label }: Props) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onSelect}
      className={clsx(
        'relative size-9 rounded-full ring-1 ring-black/10 ring-inset transition-transform active:scale-90 dark:ring-white/15',
        selected && 'outline-2 outline-offset-2 outline-accent',
      )}
      style={{ background: color }}
    >
      {selected && (
        <Check size={16} strokeWidth={3} className={clsx('absolute inset-0 m-auto', isLight(color) ? 'text-black/70' : 'text-white')} />
      )}
    </button>
  )
}

/** Opens the system colour picker. */
export function CustomSwatch({ color, selected, onChange }: { color: string; selected: boolean; onChange: (c: string) => void }) {
  return (
    <label
      title="Custom colour"
      className={clsx(
        'relative flex size-9 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90',
        selected && 'outline-2 outline-offset-2 outline-accent',
      )}
      style={{ background: 'conic-gradient(from 90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #5ac8fa, #007aff, #af52de, #ff2d55, #ff3b30)' }}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-surface">
        <Plus size={14} strokeWidth={2.5} />
      </span>
      <input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom colour" />
    </label>
  )
}
