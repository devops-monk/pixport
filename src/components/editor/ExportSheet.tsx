import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Progress'
import { useEditor } from '../../store/editor'
import { usePhoto } from '../../store/photo'
import { useApp } from '../../store/app'
import { renderEdit } from '../../lib/image/compose'
import { canvasToBlob, createCanvas, ctx2d, downloadBlob } from '../../lib/image/canvas'
import { formatBytes } from '../../lib/image/export'
import { useSources } from './EditorFlow'

type Format = 'png' | 'jpeg' | 'webp'
type Size = 'full' | '2048' | '1280' | '800'

const MIME: Record<Format, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }

export function ExportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sources = useSources()
  const recipe = useEditor((s) => s.recipe)
  const name = usePhoto((s) => s.image?.name ?? 'photo')
  const toast = useApp((s) => s.toast)
  const transparent = recipe.background.kind === 'transparent'
  const [format, setFormat] = useState<Format | null>(null)
  const [size, setSize] = useState<Size>('full')
  const [quality, setQuality] = useState(90)
  const [busy, setBusy] = useState(false)
  const fmt: Format = format ?? (transparent ? 'png' : 'jpeg')

  const fullDims = useMemo(() => {
    if (!open || !sources) return null
    const c = renderEdit(sources, recipe, { maxSize: 64 })
    const ratio = c.width / c.height
    const { width, height } = sources.original
    const swap = recipe.transform.rotate % 180 !== 0
    const w = (swap ? height : width) * (recipe.crop?.width ?? 1)
    const h = (swap ? width : height) * (recipe.crop?.height ?? 1)
    return { width: Math.round(w), height: Math.round(h), ratio }
  }, [open, sources, recipe])

  const target = (() => {
    if (!fullDims) return null
    if (size === 'full') return fullDims
    const long = Number(size)
    const s = Math.min(1, long / Math.max(fullDims.width, fullDims.height))
    return { width: Math.round(fullDims.width * s), height: Math.round(fullDims.height * s) }
  })()

  const save = async () => {
    if (!sources || !target) return
    setBusy(true)
    try {
      let out = renderEdit(sources, recipe)
      if (out.width !== target.width || out.height !== target.height || fmt === 'jpeg') {
        const c = createCanvas(target.width, target.height)
        const ctx = ctx2d(c)
        if (fmt === 'jpeg') {
          // JPEG has no transparency; flatten onto white.
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, c.width, c.height)
        }
        ctx.drawImage(out, 0, 0, c.width, c.height)
        out = c
      }
      const blob = await canvasToBlob(out, MIME[fmt], fmt === 'png' ? undefined : quality / 100)
      const ext = fmt === 'jpeg' ? 'jpg' : fmt
      downloadBlob(blob, `${name}-edited.${ext}`)
      toast(`Saved ${name}-edited.${ext} (${formatBytes(blob.size)})`, 'success')
      onClose()
    } catch (err) {
      console.error(err)
      toast('Export failed. Try a smaller size or another format.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Export"
      footer={
        <Button size="lg" className="w-full" onClick={() => void save()} disabled={busy || !target}>
          {busy ? <Spinner /> : <Download size={18} />}
          Download
        </Button>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[13px] text-ink-2">Format</p>
          <Segmented
            label="Format"
            value={fmt}
            onChange={setFormat}
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'jpeg', label: 'JPEG' },
              { value: 'webp', label: 'WebP' },
            ]}
          />
          {transparent && fmt === 'jpeg' && (
            <p className="mt-2 text-[12px] text-warn">JPEG can’t store transparency; the background will be white.</p>
          )}
        </div>
        <div>
          <p className="mb-2 text-[13px] text-ink-2">Size</p>
          <Segmented
            label="Size"
            value={size}
            onChange={setSize}
            options={[
              { value: 'full', label: 'Full' },
              { value: '2048', label: 'Large' },
              { value: '1280', label: 'Medium' },
              { value: '800', label: 'Small' },
            ]}
          />
          {target && (
            <p className="mt-2 text-[12px] text-ink-3 tabular-nums">
              {target.width} × {target.height} px
            </p>
          )}
        </div>
        {fmt !== 'png' && (
          <Slider label="Quality" value={quality} min={40} max={100} centered={false} format={(v) => `${v}%`} onChange={setQuality} />
        )}
      </div>
    </Sheet>
  )
}
