import { create } from 'zustand'

export type Screen = 'home' | 'passport' | 'editor'
export type PassportStep = 'photo' | 'document' | 'adjust' | 'export'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'error' | 'success'
}

interface AppState {
  screen: Screen
  passportStep: PassportStep
  toasts: Toast[]
  go: (screen: Screen) => void
  setPassportStep: (step: PassportStep) => void
  toast: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

let nextId = 1

export const useApp = create<AppState>((set, get) => ({
  screen: 'home',
  passportStep: 'photo',
  toasts: [],
  go: (screen) => {
    set({ screen })
    window.scrollTo({ top: 0 })
  },
  setPassportStep: (passportStep) => set({ passportStep }),
  toast: (message, tone = 'info') => {
    const id = nextId++
    set({ toasts: [...get().toasts, { id, message, tone }] })
    setTimeout(() => get().dismiss(id), tone === 'error' ? 6000 : 3500)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))
