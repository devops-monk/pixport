import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from 'lucide-react'
import clsx from 'clsx'
import { Panel } from '../layout/Studio'
import { Button, IconButton } from '../ui/Button'
import { useEditor } from '../../store/editor'
import type { Rect, Transform } from '../../types'

export type Aspect = 'original' | '1:1' | '4:5' | '3:4' | '2:3' | '16:9' | '9:16'

const ASPECTS: { value: Aspect; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: '1:1', label: 'Square' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
]

export function aspectValue(a: Aspect, original: number): number {
  if (a === 'original') return original
  const [w, h] = a.split(':').map(Number)
  return w / h
}

interface Props {
  aspect: Aspect
  setAspect: (a: Aspect) => void
  pendingCrop: Rect | null
  onDone: () => void
}

export function CropPanel({ aspect, setAspect, pendingCrop, onDone }: Props) {
  const recipe = useEditor((s) => s.recipe)
  const update = useEditor((s) => s.update)
  const t = recipe.transform

  // Rotating or flipping changes the frame, so any crop starts over.
  const transform = (patch: Partial<Transform>) => update({ transform: { ...t, ...patch }, crop: null })

  return (
    <Panel>
      <p className="mb-2 text-[13px] text-ink-2">Shape</p>
      <div className="grid grid-cols-4 gap-2">
        {ASPECTS.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => setAspect(a.value)}
            aria-pressed={aspect === a.value}
            className={clsx(
              'h-9 rounded-[10px] text-[13px] font-medium transition-colors',
              aspect === a.value ? 'bg-accent text-white' : 'bg-surface-2 hover:bg-surface-3',
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="mt-6 mb-2 text-[13px] text-ink-2">Rotate and flip</p>
      <div className="flex gap-2">
        <IconButton label="Rotate left" className="bg-surface-2" onClick={() => transform({ rotate: (((t.rotate + 270) % 360) as Transform['rotate']) })}>
          <RotateCcw size={18} />
        </IconButton>
        <IconButton label="Rotate right" className="bg-surface-2" onClick={() => transform({ rotate: (((t.rotate + 90) % 360) as Transform['rotate']) })}>
          <RotateCw size={18} />
        </IconButton>
        <IconButton label="Flip horizontal" className="bg-surface-2" onClick={() => transform({ flipH: !t.flipH })}>
          <FlipHorizontal2 size={18} />
        </IconButton>
        <IconButton label="Flip vertical" className="bg-surface-2" onClick={() => transform({ flipV: !t.flipV })}>
          <FlipVertical2 size={18} />
        </IconButton>
      </div>

      <div className="mt-7 flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            if (pendingCrop) update({ crop: pendingCrop })
            onDone()
          }}
        >
          Apply crop
        </Button>
        <Button variant="secondary" onClick={() => update({ crop: null })} disabled={!recipe.crop}>
          Remove crop
        </Button>
      </div>
      <p className="mt-3 text-[12px] text-ink-3">Drag to move, pinch or scroll to zoom.</p>
    </Panel>
  )
}
