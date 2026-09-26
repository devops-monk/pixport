import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { useApp } from '../../store/app'

const icons = { info: Info, error: AlertCircle, success: CheckCircle2 }
const tones = { info: 'text-accent', error: 'text-bad', success: 'text-good' }

export function Toasts() {
  const toasts = useApp((s) => s.toasts)
  const dismiss = useApp((s) => s.dismiss)
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.tone]
          return (
            <motion.button
              key={t.id}
              layout
              type="button"
              onClick={() => dismiss(t.id)}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className="pointer-events-auto flex max-w-md items-start gap-2.5 rounded-2xl bg-glass px-4 py-3 text-left text-[14px] shadow-soft ring-1 ring-line backdrop-blur-2xl"
            >
              <Icon size={18} className={`mt-px shrink-0 ${tones[t.tone]}`} />
              <span>{t.message}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
