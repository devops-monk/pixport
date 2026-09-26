import type { Config } from '@imgly/background-removal'
import { blobToCanvas, canvasToBlob } from '../image/canvas'

export type Phase = 'download' | 'process'

export type ProgressFn = (phase: Phase, fraction: number) => void

const hasWebGpu = () => typeof navigator !== 'undefined' && 'gpu' in navigator

let lib: Promise<typeof import('@imgly/background-removal')> | null = null
const load = () => (lib ??= import('@imgly/background-removal'))

function config(device: 'gpu' | 'cpu', onProgress?: ProgressFn): Config {
  const files = new Map<string, { current: number; total: number }>()
  return {
    device,
    // GPU runs the higher-precision model; the CPU path uses the smaller quantised one (44 MB vs 88 MB).
    model: device === 'gpu' ? 'isnet_fp16' : 'isnet_quint8',
    output: { format: 'image/png', quality: 1 },
    progress: (key, current, total) => {
      if (!onProgress) return
      if (key.startsWith('fetch:')) {
        files.set(key, { current, total })
        let c = 0
        let t = 0
        for (const f of files.values()) {
          c += f.current
          t += f.total
        }
        onProgress('download', t ? c / t : 0)
      } else if (key.startsWith('compute:')) {
        onProgress('process', total ? current / total : 0)
      }
    },
  }
}

/** Start fetching the model early so it is ready by the time a photo is picked. */
export function preloadBackgroundModel(): void {
  load()
    .then((m) => m.preload(config(hasWebGpu() ? 'gpu' : 'cpu')))
    .catch(() => {
      /* The real call will surface any error. */
    })
}

/**
 * Cut the subject out of a photo, entirely on this device.
 * Returns a canvas the same size as the input with a transparent background.
 */
export async function removeBackground(source: HTMLCanvasElement, onProgress?: ProgressFn): Promise<HTMLCanvasElement> {
  const m = await load()
  const input = await canvasToBlob(source, 'image/png')
  let blob: Blob
  try {
    blob = await m.removeBackground(input, config(hasWebGpu() ? 'gpu' : 'cpu', onProgress))
  } catch (err) {
    if (!hasWebGpu()) throw err
    // Some GPUs advertise WebGPU but fail at runtime; the CPU path is slower but reliable.
    blob = await m.removeBackground(input, config('cpu', onProgress))
  }
  const cut = await blobToCanvas(blob)
  if (cut.width === source.width && cut.height === source.height) return cut
  const resized = document.createElement('canvas')
  resized.width = source.width
  resized.height = source.height
  resized.getContext('2d')!.drawImage(cut, 0, 0, source.width, source.height)
  return resized
}
