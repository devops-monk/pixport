import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Logo } from './Logo'

interface Props {
  onBack?: () => void
  backLabel?: string
  center?: ReactNode
  right?: ReactNode
}

export function TopBar({ onBack, backLabel = 'Back', center, right }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-glass backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto grid h-13 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-5">
        <div className="flex min-w-0 items-center">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-1 flex h-9 items-center rounded-full pr-3 pl-1 text-[15px] text-accent transition-colors hover:bg-accent-soft"
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
              <span className="hidden truncate sm:inline">{backLabel}</span>
            </button>
          ) : (
            <Logo />
          )}
        </div>
        <div className="min-w-0">{center}</div>
        <div className="flex items-center justify-end gap-1">{right}</div>
      </div>
    </header>
  )
}
