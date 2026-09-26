import { canvasToBlob } from './canvas'

/**
 * Encode as JPEG at the highest quality that fits under `maxKb`.
 * `encode` is injectable so the search can be unit tested without a browser.
 */
export async function fitJpegUnderKb(
  encode: (quality: number) => Promise<Blob>,
  maxKb: number,
): Promise<{ blob: Blob; quality: number }> {
  const limit = maxKb * 1024
  let best = await encode(0.95)
  if (best.size <= limit) return { blob: best, quality: 0.95 }

  let lo = 0.1
  let hi = 0.95
  let bestQ = lo
  best = await encode(lo)
  for (let i = 0; i < 7; i++) {
    const q = (lo + hi) / 2
    const b = await encode(q)
    if (b.size <= limit) {
      best = b
      bestQ = q
      lo = q
    } else {
      hi = q
    }
  }
  return { blob: best, quality: bestQ }
}

export function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return canvasToBlob(canvas, 'image/jpeg', quality)
}

/** Write print resolution into a JPEG's JFIF header so print dialogs use the right size. */
export async function withJpegDpi(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  return new Blob([setJpegDpi(bytes, dpi)], { type: 'image/jpeg' })
}

export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array<ArrayBuffer> {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return new Uint8Array(bytes)
  const isJfif =
    bytes[2] === 0xff && bytes[3] === 0xe0 &&
    bytes[6] === 0x4a && bytes[7] === 0x46 && bytes[8] === 0x49 && bytes[9] === 0x46 && bytes[10] === 0
  if (isJfif) {
    const out = new Uint8Array(bytes)
    out[13] = 1 // units: dots per inch
    out[14] = dpi >> 8
    out[15] = dpi & 0xff
    out[16] = dpi >> 8
    out[17] = dpi & 0xff
    return out
  }
  // No JFIF segment: insert one right after the SOI marker.
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    dpi >> 8, dpi & 0xff, dpi >> 8, dpi & 0xff, 0x00, 0x00,
  ])
  const out = new Uint8Array(bytes.length + app0.length)
  out.set(bytes.subarray(0, 2), 0)
  out.set(app0, 2)
  out.set(bytes.subarray(2), 2 + app0.length)
  return out
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Add a pHYs chunk to a PNG so it carries its print resolution. */
export async function withPngDpi(blob: Blob, dpi: number): Promise<Blob> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  // Signature (8) + IHDR chunk (4 len + 4 type + 13 data + 4 crc) = 33.
  const insertAt = 33
  const ppm = Math.round(dpi / 0.0254)
  const chunk = new Uint8Array(21)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4) // "pHYs"
  view.setUint32(8, ppm)
  view.setUint32(12, ppm)
  chunk[16] = 1 // unit: metre
  view.setUint32(17, crc32(chunk.subarray(4, 17)))
  const out = new Uint8Array(bytes.length + chunk.length)
  out.set(bytes.subarray(0, insertAt), 0)
  out.set(chunk, insertAt)
  out.set(bytes.subarray(insertAt), insertAt + chunk.length)
  return new Blob([out], { type: 'image/png' })
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
