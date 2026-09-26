import type { Adjustments, PhotoSpec, Rect } from '../../types'
import { applyTone } from '../image/adjust'
import { createCanvas, ctx2d, rotateCanvas } from '../image/canvas'
import { specPixels } from '../../data/specs'

export interface PassportSource {
  original: HTMLCanvasElement
  cutout: HTMLCanvasElement | null
  useCutout: boolean
  background: string
  adjust: Adjustments
  straightenDeg: number
}

/**
 * The photo as it will be cropped: adjusted subject over the chosen background,
 * rotated to level the head. Crop rectangles are expressed in this canvas's pixels.
 */
export function preparePassportCanvas(s: PassportSource): HTMLCanvasElement {
  const { width: w, height: h } = s.original
  const subject = createCanvas(w, h)
  const sctx = ctx2d(subject)
  sctx.drawImage(s.useCutout && s.cutout ? s.cutout : s.original, 0, 0)
  applyTone(sctx, s.adjust)

  const flat = createCanvas(w, h)
  const fctx = ctx2d(flat)
  fctx.fillStyle = s.background
  fctx.fillRect(0, 0, w, h)
  fctx.drawImage(subject, 0, 0)
  return rotateCanvas(flat, s.straightenDeg, s.background)
}

/** Rotated cut-out used to locate the top of the hair. */
export function prepareMask(cutout: HTMLCanvasElement | null, straightenDeg: number): HTMLCanvasElement | null {
  return cutout ? rotateCanvas(cutout, straightenDeg) : null
}

/** Final photo at the exact pixel size the spec requires. */
export function renderPassport(prepared: HTMLCanvasElement, crop: Rect, spec: PhotoSpec, background: string): HTMLCanvasElement {
  const { width, height } = specPixels(spec)
  const out = createCanvas(width, height)
  const ctx = ctx2d(out)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  // Scale the whole canvas rather than using a source rect: the crop may extend past the
  // photo's edges, and the background fill shows through there.
  const s = width / crop.width
  ctx.drawImage(prepared, -crop.x * s, -crop.y * s, prepared.width * s, prepared.height * s)
  return out
}
