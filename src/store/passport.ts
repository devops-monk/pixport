import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Adjustments, PhotoSpec, Rect } from '../types'
import { customSpec, getSpec, suggestedSpecId } from '../data/specs'
import { NEUTRAL } from '../lib/image/adjust'

interface PassportState {
  specId: string
  custom: { widthMm: number; heightMm: number } | null
  recentIds: string[]
  useCutout: boolean
  background: string | null
  adjust: Adjustments
  straighten: number
  /** Crop in pixels of the prepared (straightened) canvas. */
  crop: Rect | null
  /** While true the crop follows the face automatically; any manual move turns it off. */
  cropAuto: boolean
  /** Bumped whenever the crop is set programmatically, so the cropper re-reads it. */
  cropVersion: number
  paperId: string
  sheetCount: number | null
  chooseSpec: (id: string) => void
  chooseCustom: (widthMm: number, heightMm: number) => void
  set: (patch: Partial<Pick<PassportState, 'useCutout' | 'background' | 'adjust' | 'straighten' | 'paperId' | 'sheetCount'>>) => void
  setCrop: (crop: Rect, fromUser: boolean) => void
  autoFit: () => void
  resetEdits: () => void
}

export const usePassport = create<PassportState>()(
  persist(
    (set, get) => ({
      specId: suggestedSpecId(),
      custom: null,
      recentIds: [],
      useCutout: true,
      background: null,
      adjust: NEUTRAL,
      straighten: 0,
      crop: null,
      cropAuto: true,
      cropVersion: 0,
      paperId: '4x6',
      sheetCount: null,
      chooseSpec: (id) =>
        set({
          specId: id,
          custom: null,
          background: null,
          crop: null,
          cropAuto: true,
          recentIds: [id, ...get().recentIds.filter((r) => r !== id)].slice(0, 4),
        }),
      chooseCustom: (widthMm, heightMm) =>
        set({ specId: 'custom', custom: { widthMm, heightMm }, background: null, crop: null, cropAuto: true }),
      set: (patch) => set(patch),
      setCrop: (crop, fromUser) =>
        set(fromUser ? { crop, cropAuto: false } : { crop, cropVersion: get().cropVersion + 1 }),
      autoFit: () => set({ cropAuto: true, crop: null }),
      resetEdits: () =>
        set({ useCutout: true, background: null, adjust: NEUTRAL, straighten: 0, crop: null, cropAuto: true, sheetCount: null }),
    }),
    {
      name: 'pixport-passport',
      partialize: (s) => ({ specId: s.specId, custom: s.custom, recentIds: s.recentIds, paperId: s.paperId }),
    },
  ),
)

export function activeSpec(s: Pick<PassportState, 'specId' | 'custom'>): PhotoSpec {
  if (s.specId === 'custom' && s.custom) return customSpec(s.custom.widthMm, s.custom.heightMm)
  return getSpec(s.specId) ?? getSpec('generic-35x45')!
}
