import { create } from 'zustand'
import type { LoadedImage } from '../lib/image/load'
import { removeBackground, type Phase } from '../lib/ml/removeBackground'
import { scanFace, type FaceScan } from '../lib/ml/face'

type Status = 'idle' | 'working' | 'done' | 'error'

interface PhotoState {
  image: LoadedImage | null
  cutout: HTMLCanvasElement | null
  cutoutStatus: Status
  cutoutPhase: Phase
  cutoutProgress: number
  cutoutError: string | null
  scan: FaceScan | null
  scanStatus: Status
  setImage: (image: LoadedImage | null) => void
  ensureCutout: () => Promise<HTMLCanvasElement | null>
  ensureScan: () => Promise<FaceScan | null>
}

const IDLE = {
  cutout: null,
  cutoutStatus: 'idle' as Status,
  cutoutPhase: 'download' as Phase,
  cutoutProgress: 0,
  cutoutError: null,
  scan: null,
  scanStatus: 'idle' as Status,
}

let cutoutJob: Promise<HTMLCanvasElement | null> | null = null
let scanJob: Promise<FaceScan | null> | null = null

export const usePhoto = create<PhotoState>((set, get) => ({
  image: null,
  ...IDLE,

  setImage: (image) => {
    cutoutJob = null
    scanJob = null
    set({ image, ...IDLE })
  },

  ensureCutout: () => {
    const { image, cutout, cutoutStatus } = get()
    if (!image) return Promise.resolve(null)
    if (cutoutStatus === 'done') return Promise.resolve(cutout)
    if (cutoutJob && cutoutStatus === 'working') return cutoutJob
    set({ cutoutStatus: 'working', cutoutProgress: 0, cutoutPhase: 'download', cutoutError: null })
    const job = removeBackground(image.canvas, (phase, fraction) => {
      if (get().image === image) set({ cutoutPhase: phase, cutoutProgress: fraction })
    })
      .then((result) => {
        if (get().image !== image) return null
        set({ cutout: result, cutoutStatus: 'done', cutoutProgress: 1 })
        return result
      })
      .catch((err: unknown) => {
        if (get().image === image) {
          console.error(err)
          set({
            cutoutStatus: 'error',
            cutoutError: 'Background removal failed. Check your connection — the model downloads once — then try again.',
          })
        }
        return null
      })
    cutoutJob = job
    return job
  },

  ensureScan: () => {
    const { image, scan, scanStatus } = get()
    if (!image) return Promise.resolve(null)
    if (scanStatus === 'done') return Promise.resolve(scan)
    if (scanJob && scanStatus === 'working') return scanJob
    set({ scanStatus: 'working' })
    const job = scanFace(image.canvas)
      .then((result) => {
        if (get().image !== image) return null
        set({ scan: result, scanStatus: 'done' })
        return result
      })
      .catch((err: unknown) => {
        console.error(err)
        if (get().image === image) set({ scan: null, scanStatus: 'error' })
        return null
      })
    scanJob = job
    return job
  },
}))
