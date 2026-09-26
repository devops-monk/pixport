import type { Adjustments, BackgroundSettings, Rect, Transform } from '../../types'
import { applyTone, drawVignette } from './adjust'
import { blurred, createCanvas, ctx2d, drawCover, type Drawable } from './canvas'

export interface Sources {
  original: HTMLCanvasElement
  cutout: HTMLCanvasElement | null
  bgImage: Drawable | null
}

export interface Recipe {
  background: BackgroundSettings
  adjust: Adjustments
  transform: Transform
  /** Crop as fractions (0..1) of the transformed image, so it works at any preview size. */
  crop: Rect | null
}

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  kind: 'original',
  color: '#ffffff',
  color2: '#d9e4ff',
  angle: 160,
  blur: 24,
}

export const IDENTITY: Transform = { rotate: 0, flipH: false, flipV: false }

/** Remember the last adjusted layer so dragging a background control stays fast. */
let layerCache: { key: string; src: HTMLCanvasElement; canvas: HTMLCanvasElement } | null = null

function adjustedLayer(src: HTMLCanvasElement, w: number, h: number, adjust: Adjustments): HTMLCanvasElement {
  const key = `${w}x${h}|${JSON.stringify(adjust)}`
  if (layerCache && layerCache.src === src && layerCache.key === key) return layerCache.canvas
  const c = createCanvas(w, h)
  const ctx = ctx2d(c)
  ctx.drawImage(src, 0, 0, w, h)
  applyTone(ctx, adjust)
  layerCache = { key, src, canvas: c }
  return c
}

export function paintBackground(
  ctx: CanvasRenderingContext2D,
  bg: BackgroundSettings,
  w: number,
  h: number,
  sources: Pick<Sources, 'original' | 'bgImage'>,
): void {
  switch (bg.kind) {
    case 'color':
      ctx.fillStyle = bg.color
      ctx.fillRect(0, 0, w, h)
      break
    case 'gradient': {
      const rad = ((bg.angle - 90) * Math.PI) / 180
      const len = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2
      const cx = w / 2
      const cy = h / 2
      const g = ctx.createLinearGradient(
        cx - Math.cos(rad) * len, cy - Math.sin(rad) * len,
        cx + Math.cos(rad) * len, cy + Math.sin(rad) * len,
      )
      g.addColorStop(0, bg.color)
      g.addColorStop(1, bg.color2)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'blur':
      ctx.drawImage(blurred(sources.original, w, h, (bg.blur / 100) * 40 * Math.max(1, w / 1200)), 0, 0)
      break
    case 'image':
      if (sources.bgImage) drawCover(ctx, sources.bgImage, w, h)
      break
    default:
      break
  }
}

/** Background + adjusted subject, before rotation/flip/crop. */
function composite(sources: Sources, recipe: Recipe, scale: number): HTMLCanvasElement {
  const w = Math.round(sources.original.width * scale)
  const h = Math.round(sources.original.height * scale)
  const useCutout = recipe.background.kind !== 'original' && sources.cutout
  const layer = adjustedLayer(useCutout ? sources.cutout! : sources.original, w, h, recipe.adjust)
  if (!useCutout) return layer

  const out = createCanvas(w, h)
  const ctx = ctx2d(out)
  paintBackground(ctx, recipe.background, w, h, sources)
  ctx.drawImage(layer, 0, 0)
  return out
}

export function applyTransform(src: HTMLCanvasElement, t: Transform): HTMLCanvasElement {
  if (!t.rotate && !t.flipH && !t.flipV) return src
  const swap = t.rotate === 90 || t.rotate === 270
  const out = createCanvas(swap ? src.height : src.width, swap ? src.width : src.height)
  const ctx = ctx2d(out)
  ctx.translate(out.width / 2, out.height / 2)
  ctx.rotate((t.rotate * Math.PI) / 180)
  ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  return out
}

export interface RenderOptions {
  /** Longest edge of the result before cropping; omit for full resolution. */
  maxSize?: number
  /** Ignore the crop (used while the crop tool is open). */
  uncropped?: boolean
}

export function renderEdit(sources: Sources, recipe: Recipe, opts: RenderOptions = {}): HTMLCanvasElement {
  const { width, height } = sources.original
  const scale = opts.maxSize ? Math.min(1, opts.maxSize / Math.max(width, height)) : 1
  const transformed = applyTransform(composite(sources, recipe, scale), recipe.transform)

  let out = transformed
  const crop = opts.uncropped ? null : recipe.crop
  if (crop) {
    const sx = crop.x * transformed.width
    const sy = crop.y * transformed.height
    const sw = crop.width * transformed.width
    const sh = crop.height * transformed.height
    out = createCanvas(sw, sh)
    ctx2d(out).drawImage(transformed, sx, sy, sw, sh, 0, 0, out.width, out.height)
  } else if (transformed === layerCache?.canvas) {
    // Never hand out the cached layer itself; the vignette below would modify it.
    out = createCanvas(transformed.width, transformed.height)
    ctx2d(out).drawImage(transformed, 0, 0)
  }

  drawVignette(ctx2d(out), recipe.adjust.vignette)
  return out
}
