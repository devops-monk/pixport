import type { ReactNode } from 'react'

/** Photo stage on the left, inspector on the right; stacks on small screens. */
export function Studio({ stage, inspector }: { stage: ReactNode; inspector: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1440px] flex-1 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-0">
      <section className="relative flex min-h-[52dvh] items-center justify-center bg-stage lg:sticky lg:top-13 lg:h-[calc(100dvh-3.25rem)]">
        {stage}
      </section>
      <aside className="border-line bg-surface lg:h-[calc(100dvh-3.25rem)] lg:overflow-y-auto lg:border-l">
        {inspector}
      </aside>
    </div>
  )
}

export function Panel({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-b border-line px-5 py-5 last:border-b-0">
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
