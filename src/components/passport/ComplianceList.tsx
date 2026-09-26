import { useState } from 'react'
import clsx from 'clsx'
import { AlertTriangle, CheckCircle2, ChevronDown, XCircle } from 'lucide-react'
import type { Check, CheckStatus } from '../../lib/passport/compliance'

const ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle }
const TONE = { pass: 'text-good', warn: 'text-warn', fail: 'text-bad' }

const HEADLINE: Record<CheckStatus, string> = {
  pass: 'Ready to use',
  warn: 'Almost there',
  fail: 'Needs attention',
}

export function ComplianceList({
  checks,
  summary,
  collapsible = false,
}: {
  checks: Check[]
  summary: { status: CheckStatus; passed: number; total: number }
  collapsible?: boolean
}) {
  // Phones start collapsed so the tools stay within reach.
  const [open, setOpen] = useState(
    () => !collapsible || (summary.status !== 'pass' && window.matchMedia('(min-width: 1024px)').matches),
  )
  const Icon = ICON[summary.status]
  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        aria-expanded={open}
        className={clsx('flex w-full items-center gap-3 text-left', !collapsible && 'cursor-default')}
      >
        <Icon size={26} className={TONE[summary.status]} strokeWidth={2} />
        <span className="flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.01em]">{HEADLINE[summary.status]}</span>
          <span className="block text-[13px] text-ink-2">
            {summary.passed} of {summary.total} checks passed
          </span>
        </span>
        {collapsible && <ChevronDown size={18} className={clsx('text-ink-3 transition-transform', open && 'rotate-180')} />}
      </button>
      {open && (
        <ul className="mt-3 space-y-0.5">
          {checks.map((c) => {
            const I = ICON[c.status]
            return (
              <li key={c.id} className="flex gap-2.5 rounded-xl px-1 py-1.5">
                <I size={17} className={clsx('mt-0.5 shrink-0', TONE[c.status])} />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{c.label}</p>
                  <p className="text-[13px] leading-snug text-ink-2">{c.detail}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
