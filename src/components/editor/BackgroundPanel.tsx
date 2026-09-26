import { useRef } from 'react'
import clsx from 'clsx'
import { Ban, Blend, Droplet, Image as ImageIcon, ScanFace, Sparkles, Undo } from 'lucide-react'
import { Panel } from '../layout/Studio'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import { Swatch, CustomSwatch } from '../ui/Swatch'
import { ProgressRing } from '../ui/Progress'
import { useEditor } from '../../store/editor'
import { usePhoto } from '../../store/photo'
import { useApp } from '../../store/app'
import { loadImageFile } from '../../lib/image/load'
import type { BackgroundKind, BackgroundSettings } from '../../types'

const KINDS: { value: BackgroundKind; label: string; icon: typeof Ban }[] = [
  { value: 'original', label: 'Original', icon: Undo },
  { value: 'transparent', label: 'None', icon: Ban },
  { value: 'color', label: 'Colour', icon: Droplet },
  { value: 'gradient', label: 'Gradient', icon: Blend },
  { value: 'blur', label: 'Blur', icon: ScanFace },
  { value: 'image', label: 'Image', icon: ImageIcon },
]

const COLORS = ['#ffffff', '#f2f2f7', '#1d1d1f', '#0071e3', '#34c759', '#ff9f0a', '#ff375f', '#bf5af2', '#dbe9f7', '#fdf1dc']

const GRADIENTS: [string, string][] = [
  ['#dbe9ff', '#ffffff'],
  ['#fbc2eb', '#a6c1ee'],
  ['#fdfcfb', '#e2d1c3'],
  ['#a1c4fd', '#c2e9fb'],
  ['#1d1d1f', '#434343'],
  ['#ff9a9e', '#fecfef'],
]

export function BackgroundPanel() {
  const status = usePhoto((s) => s.cutoutStatus)
  const phase = usePhoto((s) => s.cutoutPhase)
  const progress = usePhoto((s) => s.cutoutProgress)
  const error = usePhoto((s) => s.cutoutError)
  const ensureCutout = usePhoto((s) => s.ensureCutout)
  const bg = useEditor((s) => s.recipe.background)
  const update = useEditor((s) => s.update)
  const begin = useEditor((s) => s.beginGesture)
  const end = useEditor((s) => s.endGesture)
  const setBgImage = useEditor((s) => s.setBgImage)
  const toast = useApp((s) => s.toast)
  const fileInput = useRef<HTMLInputElement>(null)

  const setBg = (patch: Partial<BackgroundSettings>) =>
    update({ background: { ...useEditor.getState().recipe.background, ...patch } })

  const remove = async () => {
    const result = await ensureCutout()
    if (result) setBg({ kind: 'transparent' })
  }

  if (status !== 'done') {
    return (
      <Panel>
        <div className="rounded-2xl bg-surface-2 p-5 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            {status === 'working' ? <ProgressRing value={phase === 'download' ? progress : null} size={26} /> : <Sparkles size={24} />}
          </div>
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
            {status === 'working' ? (phase === 'download' ? 'Getting ready…' : 'Removing background…') : 'Remove the background'}
          </h3>
          <p className="mx-auto mt-1 max-w-[30ch] text-[13px] leading-relaxed text-ink-2">
            {status === 'working'
              ? phase === 'download'
                ? `Downloading the background tool, ${Math.round(progress * 100)}%. This happens once.`
                : 'Finding the edges of the subject. Usually a few seconds.'
              : status === 'error'
                ? error
                : 'Runs on this device. The first time, it downloads the background tool (about 50 MB).'}
          </p>
          {status !== 'working' && (
            <Button className="mt-4" onClick={() => void remove()}>
              {status === 'error' ? 'Try again' : 'Remove background'}
            </Button>
          )}
        </div>
      </Panel>
    )
  }

  return (
    <>
      <Panel>
        <div className="grid grid-cols-3 gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              aria-pressed={bg.kind === k.value}
              onClick={() => (k.value === 'image' && !useEditor.getState().bgImage ? fileInput.current?.click() : setBg({ kind: k.value }))}
              className={clsx(
                'flex h-[62px] flex-col items-center justify-center gap-1 rounded-xl text-[12px] font-medium transition-colors',
                bg.kind === k.value ? 'bg-accent text-white' : 'bg-surface-2 text-ink hover:bg-surface-3',
              )}
            >
              <k.icon size={18} />
              {k.label}
            </button>
          ))}
        </div>
      </Panel>

      {bg.kind === 'color' && (
        <Panel title="Colour">
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <Swatch key={c} color={c} label={c} selected={bg.color === c} onSelect={() => setBg({ color: c })} />
            ))}
            <CustomSwatch color={bg.color} selected={!COLORS.includes(bg.color)} onChange={(c) => setBg({ color: c })} />
          </div>
        </Panel>
      )}

      {bg.kind === 'gradient' && (
        <Panel title="Gradient">
          <div className="flex flex-wrap gap-3">
            {GRADIENTS.map(([a, b]) => (
              <button
                key={a + b}
                type="button"
                aria-label={`Gradient ${a} to ${b}`}
                aria-pressed={bg.color === a && bg.color2 === b}
                onClick={() => setBg({ color: a, color2: b })}
                className={clsx(
                  'size-9 rounded-full ring-1 ring-black/10 ring-inset transition-transform active:scale-90',
                  bg.color === a && bg.color2 === b && 'outline-2 outline-offset-2 outline-accent',
                )}
                style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 text-[13px] text-ink-2">
            From <CustomSwatch color={bg.color} selected={false} onChange={(c) => setBg({ color: c })} />
            to <CustomSwatch color={bg.color2} selected={false} onChange={(c) => setBg({ color2: c })} />
          </div>
          <div className="mt-4">
            <Slider
              label="Angle"
              value={bg.angle}
              min={0}
              max={360}
              centered={false}
              format={(v) => `${v}°`}
              onGestureStart={begin}
              onGestureEnd={end}
              onChange={(v) => setBg({ angle: v })}
            />
          </div>
        </Panel>
      )}

      {bg.kind === 'blur' && (
        <Panel title="Blur">
          <Slider
            label="Strength"
            value={bg.blur}
            min={1}
            max={100}
            centered={false}
            onGestureStart={begin}
            onGestureEnd={end}
            onChange={(v) => setBg({ blur: v })}
          />
          <p className="mt-3 text-[12px] text-ink-3">Keeps the subject sharp, like Portrait mode.</p>
        </Panel>
      )}

      {bg.kind === 'image' && (
        <Panel title="Image">
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            Choose another image
          </Button>
        </Panel>
      )}

      {bg.kind === 'transparent' && (
        <Panel>
          <p className="text-[13px] leading-relaxed text-ink-2">Export as PNG or WebP to keep the transparency.</p>
        </Panel>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            const img = await loadImageFile(file)
            setBgImage(img.canvas)
            setBg({ kind: 'image' })
          } catch (err) {
            toast(err instanceof Error ? err.message : 'That image could not be opened.', 'error')
          }
        }}
      />
    </>
  )
}
