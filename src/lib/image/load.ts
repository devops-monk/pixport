import { createCanvas, ctx2d } from './canvas'

/** Keeps memory and model time reasonable while leaving plenty of detail for print. */
export const MAX_WORKING_SIZE = 2400

export interface LoadedImage {
  canvas: HTMLCanvasElement
  name: string
}

const HEIC = /\.(heic|heif)$/i

export function isSupportedFile(file: File): boolean {
  return file.type.startsWith('image/') || HEIC.test(file.name)
}

async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    // Browsers apply EXIF orientation here, so phone photos come out upright.
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch (err) {
    const isHeic = file.type.includes('heic') || file.type.includes('heif') || (file instanceof File && HEIC.test(file.name))
    if (!isHeic) throw err
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
    return createImageBitmap(Array.isArray(converted) ? converted[0] : converted)
  }
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!isSupportedFile(file)) throw new Error(`“${file.name}” is not an image. Choose a JPEG, PNG, WebP or HEIC photo.`)
  let bmp: ImageBitmap
  try {
    bmp = await decode(file)
  } catch {
    throw new Error(`“${file.name}” could not be opened. Try exporting it as JPEG first.`)
  }
  const canvas = fitCanvas(bmp, MAX_WORKING_SIZE)
  bmp.close()
  return { canvas, name: file.name.replace(/\.[^.]+$/, '') || 'photo' }
}

export function fitCanvas(src: CanvasImageSource & { width: number; height: number }, maxSize: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(src.width, src.height))
  const c = createCanvas(src.width * scale, src.height * scale)
  ctx2d(c).drawImage(src, 0, 0, c.width, c.height)
  return c
}
