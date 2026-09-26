import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { flagEmoji, getSpec } from '../../data/specs'
import { planPlacement } from '../../lib/passport/autoCrop'
import type { PhotoSpec } from '../../types'

const TOUR = ['us-passport', 'schengen-visa', 'cn-visa', 'ca-passport', 'in-passport']
const K = 4.6 // px per mm: every document is drawn at its true relative size
const VIEW_W = 480
const VIEW_H = 400
const EYE_RATIO = 0.47
const spring = { type: 'spring', bounce: 0.18, duration: 0.9 } as const

function geometry(spec: PhotoSpec) {
  const plan = planPlacement(spec, EYE_RATIO)
  const w = spec.widthMm * K
  const h = spec.heightMm * K
  const x = (VIEW_W - w) / 2
  const y = (VIEW_H - h) / 2 - 12
  const head = plan.headMm * K
  const crown = y + plan.topMarginMm * K
  const chin = crown + head
  const eye = y + h - plan.eyeFromBottomMm * K
  return { w, h, x, y, head, crown, chin, eye, cx: VIEW_W / 2 }
}

/**
 * The home page centrepiece: a live diagram of each document's real proportions,
 * with the head placed by the same maths the app uses to crop photos.
 */
export function SpecCard() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % TOUR.length), 3200)
    return () => clearInterval(t)
  }, [])
  const spec = getSpec(TOUR[i])!
  const g = geometry(spec)
  const headW = g.head * 0.74
  const shoulderY = g.chin + g.head * 0.18

  return (
    <figure className="relative mx-auto w-full max-w-[500px]">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full" role="img" aria-label={`${spec.country} ${spec.title}: ${spec.widthMm} by ${spec.heightMm} millimetres`}>
        <defs>
          <clipPath id="frame-clip">
            <motion.rect initial={false} animate={{ x: g.x, y: g.y, width: g.w, height: g.h }} transition={spring} rx={3} />
          </clipPath>
          <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* The photo */}
        <motion.rect
          initial={false}
          animate={{ x: g.x, y: g.y, width: g.w, height: g.h }}
          transition={spring}
          rx={3}
          fill="#fff"
          filter="url(#paper-shadow)"
        />
        <g clipPath="url(#frame-clip)">
          <motion.path
            initial={false}
            animate={{
              d: `M ${g.cx - g.w * 0.62} ${g.y + g.h + 40} C ${g.cx - g.w * 0.55} ${shoulderY + 6}, ${g.cx - headW * 0.9} ${shoulderY - 4}, ${g.cx - headW * 0.28} ${g.chin - 6} L ${g.cx + headW * 0.28} ${g.chin - 6} C ${g.cx + headW * 0.9} ${shoulderY - 4}, ${g.cx + g.w * 0.55} ${shoulderY + 6}, ${g.cx + g.w * 0.62} ${g.y + g.h + 40} Z`,
            }}
            transition={spring}
            fill="#c9ced6"
          />
          <motion.ellipse
            initial={false}
            animate={{ cx: g.cx, cy: (g.crown + g.chin) / 2, rx: headW / 2, ry: g.head / 2 }}
            transition={spring}
            fill="#dde1e7"
          />
        </g>

        {/* Guides */}
        <g stroke="var(--accent)" strokeWidth={1.5} fill="none">
          <motion.line initial={false} animate={{ x1: g.x - 12, x2: g.x + g.w + 12, y1: g.eye, y2: g.eye }} transition={spring} strokeDasharray="4 4" />
          <motion.line initial={false} animate={{ x1: g.x + g.w + 22, x2: g.x + g.w + 22, y1: g.crown, y2: g.chin }} transition={spring} />
          <motion.line initial={false} animate={{ x1: g.x + g.w + 16, x2: g.x + g.w + 28, y1: g.crown, y2: g.crown }} transition={spring} />
          <motion.line initial={false} animate={{ x1: g.x + g.w + 16, x2: g.x + g.w + 28, y1: g.chin, y2: g.chin }} transition={spring} />
        </g>
        <g stroke="var(--ink-3)" strokeWidth={1} fill="none">
          <motion.line initial={false} animate={{ x1: g.x, x2: g.x + g.w, y1: g.y + g.h + 20, y2: g.y + g.h + 20 }} transition={spring} />
          <motion.line initial={false} animate={{ x1: g.x - 20, x2: g.x - 20, y1: g.y, y2: g.y + g.h }} transition={spring} />
        </g>

        <g fontSize={12} fontFamily="var(--font-sans)" fill="var(--ink-2)">
          <motion.text initial={false} animate={{ x: g.cx, y: g.y + g.h + 36 }} transition={spring} textAnchor="middle">
            {fmt(spec.widthMm)} mm
          </motion.text>
          <motion.text initial={false} animate={{ x: g.x - 28, y: g.y + g.h / 2 + 4 }} transition={spring} textAnchor="end">
            {fmt(spec.heightMm)} mm
          </motion.text>
          <motion.text initial={false} animate={{ x: g.x + g.w + 32, y: (g.crown + g.chin) / 2 + 4 }} transition={spring} fill="var(--accent)">
            head {spec.head[0]}–{spec.head[1]} mm
          </motion.text>
          <motion.text initial={false} animate={{ x: g.x - 20, y: g.eye + 4 }} transition={spring} textAnchor="end" fill="var(--accent)">
            eyes
          </motion.text>
        </g>
      </svg>

      <figcaption className="mt-1 flex h-7 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={spec.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-[15px] text-ink-2"
          >
            <span className="mr-1.5">{flagEmoji(spec.iso2)}</span>
            {spec.country} {spec.title.toLowerCase()}
          </motion.span>
        </AnimatePresence>
      </figcaption>
    </figure>
  )
}

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1))
