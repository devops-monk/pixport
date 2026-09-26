export type Drawable = HTMLCanvasElement | ImageBitmap | HTMLImageElement | HTMLVideoElement

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(width))
  c.height = Math.max(1, Math.round(height))
  return c
}

export function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D is not available in this browser.')
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

export function sizeOf(d: Drawable): { width: number; height: number } {
  if (d instanceof HTMLImageElement) return { width: d.naturalWidth, height: d.naturalHeight }
  if (d instanceof HTMLVideoElement) return { width: d.videoWidth, height: d.videoHeight }
  return { width: d.width, height: d.height }
}

/** Copy a drawable into a new canvas, optionally scaled. */
export function toCanvas(d: Drawable, scale = 1): HTMLCanvasElement {
  const { width, height } = sizeOf(d)
  const c = createCanvas(width * scale, height * scale)
  ctx2d(c).drawImage(d, 0, 0, c.width, c.height)
  return c
}

/** Draw `d` so that it covers the whole target, cropping the overflow. */
export function drawCover(ctx: CanvasRenderingContext2D, d: Drawable, w: number, h: number): void {
  const s = sizeOf(d)
  const scale = Math.max(w / s.width, h / s.height)
  const dw = s.width * scale
  const dh = s.height * scale
  ctx.drawImage(d, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

/** Cheap, cross-browser blur: shrink then enlarge with smoothing. */
export function blurred(d: Drawable, width: number, height: number, amount: number): HTMLCanvasElement {
  const factor = Math.max(4, amount)
  const small = createCanvas(width / factor, height / factor)
  const sctx = ctx2d(small)
  sctx.drawImage(d, 0, 0, small.width, small.height)
  // A second smaller pass removes the blocky look at high amounts.
  const tiny = createCanvas(small.width / 2, small.height / 2)
  ctx2d(tiny).drawImage(small, 0, 0, tiny.width, tiny.height)
  sctx.clearRect(0, 0, small.width, small.height)
  sctx.drawImage(tiny, 0, 0, small.width, small.height)
  const out = createCanvas(width, height)
  ctx2d(out).drawImage(small, 0, 0, width, height)
  return out
}

export function canvasToBlob(c: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image.'))), type, quality),
  )
}

export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(blob)
  const c = toCanvas(bmp)
  bmp.close()
  return c
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Rotate a canvas by an arbitrary angle into its bounding box, filling the corners. */
export function rotateCanvas(src: HTMLCanvasElement, deg: number, fill?: string): HTMLCanvasElement {
  if (!deg) return src
  const rad = (deg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const w = src.width * cos + src.height * sin
  const h = src.width * sin + src.height * cos
  const out = createCanvas(w, h)
  const ctx = ctx2d(out)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, out.width, out.height)
  }
  ctx.translate(out.width / 2, out.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(src, -src.width / 2, -src.height / 2)
  return out
}

/** Map a point from the source canvas into the canvas produced by `rotateCanvas`. */
export function rotatePoint(
  p: { x: number; y: number },
  srcW: number,
  srcH: number,
  deg: number,
): { x: number; y: number } {
  if (!deg) return p
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const w = srcW * Math.abs(cos) + srcH * Math.abs(sin)
  const h = srcW * Math.abs(sin) + srcH * Math.abs(cos)
  const dx = p.x - srcW / 2
  const dy = p.y - srcH / 2
  return { x: w / 2 + dx * cos - dy * sin, y: h / 2 + dx * sin + dy * cos }
}
