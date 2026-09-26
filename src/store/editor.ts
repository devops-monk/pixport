import { create } from 'zustand'
import type { Drawable } from '../lib/image/canvas'
import { DEFAULT_BACKGROUND, IDENTITY, type Recipe } from '../lib/image/compose'
import { NEUTRAL } from '../lib/image/adjust'

const FRESH: Recipe = { background: DEFAULT_BACKGROUND, adjust: NEUTRAL, transform: IDENTITY, crop: null }
const HISTORY_LIMIT = 60

interface EditorState {
  recipe: Recipe
  filterId: string
  bgImage: Drawable | null
  past: Recipe[]
  future: Recipe[]
  /** Snapshot taken when a slider drag starts, committed to history when it ends. */
  gestureStart: Recipe | null
  update: (patch: Partial<Recipe>, opts?: { filterId?: string }) => void
  beginGesture: () => void
  endGesture: () => void
  setBgImage: (img: Drawable | null) => void
  undo: () => void
  redo: () => void
  reset: () => void
}

export const useEditor = create<EditorState>((set, get) => ({
  recipe: FRESH,
  filterId: 'none',
  bgImage: null,
  past: [],
  future: [],
  gestureStart: null,

  update: (patch, opts) => {
    const { recipe, past, gestureStart } = get()
    const next = { ...recipe, ...patch }
    set({
      recipe: next,
      ...(opts?.filterId !== undefined ? { filterId: opts.filterId } : {}),
      // Mid-gesture changes are folded into one history step by endGesture.
      ...(gestureStart ? {} : { past: [...past, recipe].slice(-HISTORY_LIMIT), future: [] }),
    })
  },
  beginGesture: () => {
    if (!get().gestureStart) set({ gestureStart: get().recipe })
  },
  endGesture: () => {
    const { gestureStart, recipe, past } = get()
    if (!gestureStart) return
    set({
      gestureStart: null,
      ...(gestureStart !== recipe ? { past: [...past, gestureStart].slice(-HISTORY_LIMIT), future: [] } : {}),
    })
  },
  setBgImage: (bgImage) => set({ bgImage }),
  undo: () => {
    const { past, future, recipe } = get()
    const prev = past.at(-1)
    if (!prev) return
    set({ recipe: prev, past: past.slice(0, -1), future: [recipe, ...future] })
  },
  redo: () => {
    const { past, future, recipe } = get()
    const next = future[0]
    if (!next) return
    set({ recipe: next, past: [...past, recipe], future: future.slice(1) })
  },
  reset: () => set({ recipe: FRESH, filterId: 'none', bgImage: null, past: [], future: [], gestureStart: null }),
}))
