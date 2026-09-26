import type { Adjustments } from '../../types'

export const NEUTRAL: Adjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  tint: 0,
  sharpness: 0,
  vignette: 0,
}

export function isNeutral(a: Adjustments): boolean {
  return (Object.keys(NEUTRAL) as (keyof Adjustments)[]).every((k) => a[k] === 0)
}

/**
 * Tone and colour adjustments applied per pixel, in place.
 * Written by hand rather than with `ctx.filter` so results match on every browser.
 */
export function applyTone(ctx: CanvasRenderingContext2D, a: Adjustments): void {
  const { width, height } = ctx.canvas
  if (!width || !height) return
  const toneChanged =
    a.exposure || a.brightness || a.contrast || a.saturation || a.warmth || a.tint
  if (toneChanged) {
    const img = ctx.getImageData(0, 0, width, height)
    toneImageData(img.data, a)
    ctx.putImageData(img, 0, 0)
  }
  if (a.sharpness > 0) sharpen(ctx, a.sharpness / 100)
}

export function toneImageData(d: Uint8ClampedArray, a: Adjustments): void {
  // Exposure, brightness and contrast are the same curve for every channel → one lookup table.
  const lut = new Uint8ClampedArray(256)
  const gain = 2 ** (a.exposure / 100)
  const offset = (a.brightness / 100) * 64
  const c = a.contrast / 100
  const contrast = c >= 0 ? 1 + c * 1.2 : 1 + c * 0.8
  for (let i = 0; i < 256; i++) {
    let v = i * gain + offset
    v = (v - 128) * contrast + 128
    lut[i] = v
  }

  const sat = 1 + a.saturation / 100
  const warm = (a.warmth / 100) * 40
  const tint = (a.tint / 100) * 30
  const colourChanged = sat !== 1 || warm !== 0 || tint !== 0

  for (let i = 0; i < d.length; i += 4) {
    let r = lut[d[i]]
    let g = lut[d[i + 1]]
    let b = lut[d[i + 2]]
    if (colourChanged) {
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = l + (r - l) * sat + warm
      g = l + (g - l) * sat - tint
      b = l + (b - l) * sat - warm
    }
    d[i] = r
    d[i + 1] = g
    d[i + 2] = b
  }
}

/** Unsharp mask with a 3×3 kernel; `amount` 0..1. */
function sharpen(ctx: CanvasRenderingContext2D, amount: number): void {
  const { width: w, height: h } = ctx.canvas
  const src = ctx.getImageData(0, 0, w, h)
  const out = ctx.createImageData(w, h)
  const s = src.data
  const o = out.data
  const k = amount * 1.2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        o[i] = s[i]; o[i + 1] = s[i + 1]; o[i + 2] = s[i + 2]; o[i + 3] = s[i + 3]
        continue
      }
      for (let ch = 0; ch < 3; ch++) {
        const c = s[i + ch]
        const n = s[i + ch - 4] + s[i + ch + 4] + s[i + ch - w * 4] + s[i + ch + w * 4]
        o[i + ch] = c + k * (4 * c - n)
      }
      o[i + 3] = s[i + 3]
    }
  }
  ctx.putImageData(out, 0, 0)
}

/** Darken (positive) or lighten (negative) the corners. */
export function drawVignette(ctx: CanvasRenderingContext2D, amount: number): void {
  if (!amount) return
  const { width: w, height: h } = ctx.canvas
  const r = Math.hypot(w, h) / 2
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.35, w / 2, h / 2, r)
  const tone = amount > 0 ? '0,0,0' : '255,255,255'
  g.addColorStop(0, `rgba(${tone},0)`)
  g.addColorStop(1, `rgba(${tone},${Math.min(0.85, Math.abs(amount) / 100)})`)
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

export interface FilterPreset {
  id: string
  name: string
  values: Partial<Adjustments>
}

export const FILTERS: FilterPreset[] = [
  { id: 'none', name: 'Original', values: {} },
  { id: 'vivid', name: 'Vivid', values: { saturation: 30, contrast: 12 } },
  { id: 'warm', name: 'Warm', values: { warmth: 30, saturation: 8 } },
  { id: 'cool', name: 'Cool', values: { warmth: -28, tint: -5 } },
  { id: 'bright', name: 'Bright', values: { exposure: 18, contrast: -6, saturation: 6 } },
  { id: 'fade', name: 'Fade', values: { contrast: -28, brightness: 12, saturation: -18 } },
  { id: 'dramatic', name: 'Dramatic', values: { contrast: 36, saturation: -12, vignette: 45, exposure: -6 } },
  { id: 'mono', name: 'Mono', values: { saturation: -100, contrast: 10 } },
  { id: 'noir', name: 'Noir', values: { saturation: -100, contrast: 45, exposure: -10, vignette: 35 } },
  { id: 'silvertone', name: 'Silvertone', values: { saturation: -100, brightness: 10, contrast: -10, warmth: 12 } },
]

export function presetAdjustments(p: FilterPreset): Adjustments {
  return { ...NEUTRAL, ...p.values }
}
