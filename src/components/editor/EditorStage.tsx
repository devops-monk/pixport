import { useEffect, useMemo, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import clsx from 'clsx'
import { usePhoto } from '../../store/photo'
import { useEditor } from '../../store/editor'
import { useCanvasUrl } from '../../hooks/useCanvasUrl'
import { renderEdit } from '../../lib/image/compose'
import { NEUTRAL } from '../../lib/image/adjust'
import { aspectValue, type Aspect } from './CropPanel'
import { useSources } from './EditorFlow'
import type { Rect } from '../../types'

interface Props {
  preview: HTMLCanvasElement | null
  cropMode: boolean
  aspect: Aspect
  onCropChange: (crop: Rect) => void
}

export function EditorStage({ preview, cropMode, aspect, onCropChange }: Props) {
  if (cropMode && preview) return <CropView preview={preview} aspect={aspect} onCropChange={onCropChange} />
  return <PreviewView preview={preview} />
}

function PreviewView({ preview }: { preview: HTMLCanvasElement | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [comparing, setComparing] = useState(false)
  const sources = useSources()
  const recipe = useEditor((s) => s.recipe)
  const transparent = recipe.background.kind === 'transparent'

  // "Before" keeps the same crop and rotation so the comparison lines up.
  const before = useMemo(
    () =>
      comparing && sources
        ? renderEdit(sources, { ...recipe, adjust: NEUTRAL, background: { ...recipe.background, kind: 'original' } }, { maxSize: 1600 })
        : null,
    [comparing, sources, recipe],
  )
  const shown = before ?? preview

  useEffect(() => {
    const c = ref.current
    if (!c || !shown) return
    c.width = shown.width
    c.height = shown.height
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.drawImage(shown, 0, 0)
  }, [shown])

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
      <canvas
        ref={ref}
        className={clsx('max-h-full max-w-full rounded-[4px] shadow-[0_12px_40px_rgb(0_0_0/0.18)]', transparent && !before && 'checker')}
        style={{ width: 'auto', height: 'auto' }}
      />
      <button
        type="button"
        onPointerDown={() => setComparing(true)}
        onPointerUp={() => setComparing(false)}
        onPointerLeave={() => setComparing(false)}
        onKeyDown={(e) => e.key === ' ' && setComparing(true)}
        onKeyUp={() => setComparing(false)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-glass px-4 py-2 text-[13px] font-medium shadow-soft ring-1 ring-line backdrop-blur-2xl select-none active:scale-95 sm:bottom-6"
      >
        {comparing ? 'Showing original' : 'Hold to compare'}
      </button>
    </div>
  )
}

function CropView({ preview, aspect, onCropChange }: { preview: HTMLCanvasElement; aspect: Aspect; onCropChange: (c: Rect) => void }) {
  const url = useCanvasUrl(preview, 'image/png')
  const crop = useEditor((s) => s.recipe.crop)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const image = usePhoto((s) => s.image)
  const value = aspectValue(aspect, preview.width / preview.height)

  // Reopen with the existing crop, but only when it matches the chosen shape.
  const initial =
    crop && Math.abs((crop.width * preview.width) / (crop.height * preview.height) - value) < 0.01
      ? { x: crop.x * 100, y: crop.y * 100, width: crop.width * 100, height: crop.height * 100 }
      : undefined

  if (!url || !image) return null
  return (
    <div className="absolute inset-3 overflow-hidden rounded-[18px] sm:inset-6">
      <Cropper
        key={aspect}
        image={url}
        aspect={value}
        crop={pos}
        zoom={zoom}
        minZoom={1}
        maxZoom={8}
        showGrid
        objectFit="contain"
        initialCroppedAreaPercentages={initial}
        onCropChange={setPos}
        onZoomChange={setZoom}
        onCropComplete={(area) =>
          onCropChange({ x: area.x / 100, y: area.y / 100, width: area.width / 100, height: area.height / 100 })
        }
        style={{ containerStyle: { background: 'transparent' } }}
      />
    </div>
  )
}
