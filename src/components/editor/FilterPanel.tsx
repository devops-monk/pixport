import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Panel } from '../layout/Studio'
import { useEditor } from '../../store/editor'
import { FILTERS, presetAdjustments } from '../../lib/image/adjust'
import { renderEdit } from '../../lib/image/compose'
import { useSources } from './EditorFlow'

export function FilterPanel() {
  const sources = useSources()
  const recipe = useEditor((s) => s.recipe)
  const filterId = useEditor((s) => s.filterId)
  const update = useEditor((s) => s.update)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  const { background, transform, crop } = recipe
  useEffect(() => {
    if (!sources) return
    // Render after paint so opening the tab never stalls.
    const id = requestAnimationFrame(() => {
      const next: Record<string, string> = {}
      for (const f of FILTERS) {
        const c = renderEdit(sources, { background, transform, crop, adjust: presetAdjustments(f) }, { maxSize: 360 })
        next[f.id] = c.toDataURL('image/jpeg', 0.8)
      }
      setThumbs(next)
    })
    return () => cancelAnimationFrame(id)
  }, [sources, background, transform, crop])

  return (
    <Panel>
      <div className="grid grid-cols-3 gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => update({ adjust: presetAdjustments(f) }, { filterId: f.id })}
            aria-pressed={filterId === f.id}
            className="group text-center"
          >
            <span
              className={clsx(
                'block aspect-square overflow-hidden rounded-xl bg-surface-2 ring-offset-2 ring-offset-surface transition-shadow',
                filterId === f.id ? 'ring-2 ring-accent' : 'group-hover:ring-2 group-hover:ring-line',
              )}
            >
              {thumbs[f.id] && <img src={thumbs[f.id]} alt="" className="size-full object-cover" />}
            </span>
            <span className={clsx('mt-1.5 block text-[12px]', filterId === f.id ? 'font-semibold text-accent' : 'text-ink-2')}>{f.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-ink-3">Fine-tune any filter in Adjust.</p>
    </Panel>
  )
}
