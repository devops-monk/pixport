import { RotateCcw } from 'lucide-react'
import { Panel } from '../layout/Studio'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import { useEditor } from '../../store/editor'
import { NEUTRAL, isNeutral } from '../../lib/image/adjust'
import type { Adjustments } from '../../types'

const GROUPS: { title: string; items: { key: keyof Adjustments; label: string; min?: number }[] }[] = [
  {
    title: 'Light',
    items: [
      { key: 'exposure', label: 'Exposure' },
      { key: 'brightness', label: 'Brightness' },
      { key: 'contrast', label: 'Contrast' },
    ],
  },
  {
    title: 'Colour',
    items: [
      { key: 'saturation', label: 'Saturation' },
      { key: 'warmth', label: 'Warmth' },
      { key: 'tint', label: 'Tint' },
    ],
  },
  {
    title: 'Detail',
    items: [
      { key: 'sharpness', label: 'Sharpness', min: 0 },
      { key: 'vignette', label: 'Vignette' },
    ],
  },
]

export function AdjustPanel() {
  const adjust = useEditor((s) => s.recipe.adjust)
  const update = useEditor((s) => s.update)
  const begin = useEditor((s) => s.beginGesture)
  const end = useEditor((s) => s.endGesture)

  const setOne = (key: keyof Adjustments, v: number) =>
    update({ adjust: { ...useEditor.getState().recipe.adjust, [key]: v } }, { filterId: 'custom' })

  return (
    <>
      {GROUPS.map((g, i) => (
        <Panel
          key={g.title}
          title={g.title}
          action={
            i === 0 && (
              <Button variant="plain" size="sm" disabled={isNeutral(adjust)} onClick={() => update({ adjust: NEUTRAL }, { filterId: 'none' })}>
                <RotateCcw size={14} /> Reset all
              </Button>
            )
          }
        >
          <div className="space-y-4">
            {g.items.map((it) => (
              <Slider
                key={it.key}
                label={it.label}
                value={adjust[it.key]}
                min={it.min}
                resetTo={0}
                onGestureStart={begin}
                onGestureEnd={end}
                onChange={(v) => setOne(it.key, v)}
              />
            ))}
          </div>
        </Panel>
      ))}
    </>
  )
}
