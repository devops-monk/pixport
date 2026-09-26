import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Check, Ruler, Search } from 'lucide-react'
import { DOC_LABELS, SPECS, flagEmoji, suggestedSpecId } from '../../data/specs'
import { activeSpec, usePassport } from '../../store/passport'
import { useApp } from '../../store/app'
import { usePhoto } from '../../store/photo'
import { Segmented } from '../ui/Segmented'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import type { DocType, PhotoSpec } from '../../types'

type Filter = 'all' | DocType

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'id', label: 'ID' },
  { value: 'generic', label: 'Sizes' },
]

const mm = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1))
export const sizeLabel = (s: PhotoSpec) => `${mm(s.widthMm)} × ${mm(s.heightMm)} mm`

export function DocumentStep() {
  const specId = usePassport((s) => s.specId)
  const custom = usePassport((s) => s.custom)
  const recentIds = usePassport((s) => s.recentIds)
  const chooseSpec = usePassport((s) => s.chooseSpec)
  const setStep = useApp((s) => s.setPassportStep)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [customOpen, setCustomOpen] = useState(false)
  const spec = useMemo(() => activeSpec({ specId, custom }), [specId, custom])

  const q = query.trim().toLowerCase()
  const matches = useMemo(
    () =>
      SPECS.filter((s) => (filter === 'all' || s.doc === filter) && (!q || `${s.country} ${s.title} ${s.iso2 ?? ''} ${DOC_LABELS[s.doc]}`.toLowerCase().includes(q))),
    [q, filter],
  )

  const suggested = useMemo(() => {
    const ids = [...new Set([suggestedSpecId(), ...recentIds])]
    return ids.map((id) => SPECS.find((s) => s.id === id)).filter((s): s is PhotoSpec => !!s).slice(0, 4)
  }, [recentIds])

  const countries = matches.filter((s) => s.doc !== 'generic').sort((a, b) => a.country.localeCompare(b.country))
  const sizes = matches.filter((s) => s.doc === 'generic')
  const showSuggested = !q && filter === 'all' && suggested.length > 0

  return (
    <main className="mx-auto grid w-full max-w-[1180px] flex-1 gap-8 px-4 pt-6 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-10">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-[-0.025em]">Which document is this for?</h1>
        <p className="mt-1 text-[15px] text-ink-2">Size, head height and background are set automatically.</p>

        <div className="sticky top-13 z-10 -mx-4 mt-5 space-y-3 bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0">
          <label className="flex h-11 items-center gap-2 rounded-xl bg-surface-2 px-3.5 focus-within:ring-2 focus-within:ring-accent/40">
            <Search size={17} className="text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or document"
              className="w-full bg-transparent text-[16px] outline-none placeholder:text-ink-3"
            />
          </label>
          <Segmented label="Document type" value={filter} options={FILTERS} onChange={setFilter} />
        </div>

        {showSuggested && (
          <Group title="Suggested">
            {suggested.map((s) => (
              <SpecRow key={`sug-${s.id}`} spec={s} selected={s.id === specId} onSelect={() => chooseSpec(s.id)} />
            ))}
          </Group>
        )}

        {countries.length > 0 && (
          <Group title={q ? 'Results' : 'All countries'}>
            {countries.map((s) => (
              <SpecRow key={s.id} spec={s} selected={s.id === specId} onSelect={() => chooseSpec(s.id)} />
            ))}
          </Group>
        )}

        {(filter === 'all' || filter === 'generic') && (
          <Group title="Standard sizes">
            {sizes.map((s) => (
              <SpecRow key={s.id} spec={s} selected={s.id === specId} onSelect={() => chooseSpec(s.id)} />
            ))}
            <li>
              <button
                type="button"
                onClick={() => setCustomOpen(true)}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-surface-2',
                  specId === 'custom' && 'bg-accent-soft',
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
                  <Ruler size={17} />
                </span>
                <span className="flex-1">
                  <span className="block text-[15px] font-medium">Custom size</span>
                  <span className="block text-[13px] text-ink-2">
                    {specId === 'custom' && custom ? `${custom.widthMm} × ${custom.heightMm} mm` : 'Enter width and height'}
                  </span>
                </span>
                {specId === 'custom' && <Check size={18} className="text-accent" strokeWidth={2.5} />}
              </button>
            </li>
          </Group>
        )}

        {matches.length === 0 && (
          <p className="py-16 text-center text-[15px] text-ink-2">
            Nothing matches “{query}”. Try the country name in English, or use a custom size.
          </p>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <Summary spec={spec} onContinue={() => setStep('adjust')} />
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-glass px-4 py-3 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <span className="text-[22px]">{flagEmoji(spec.iso2)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium">{spec.country}</p>
            <p className="truncate text-[13px] text-ink-2">
              {spec.title} · {sizeLabel(spec)}
            </p>
          </div>
          <Button onClick={() => setStep('adjust')}>Continue</Button>
        </div>
      </div>

      <CustomSizeSheet open={customOpen} onClose={() => setCustomOpen(false)} />
    </main>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-1 px-3 text-[13px] font-medium text-ink-2">{title}</h2>
      <ul className="rounded-2xl bg-surface p-1.5">{children}</ul>
    </section>
  )
}

function SpecRow({ spec, selected, onSelect }: { spec: PhotoSpec; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={clsx(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
          selected ? 'bg-accent-soft' : 'hover:bg-surface-2',
        )}
      >
        <span className="flex size-8 items-center justify-center text-[22px] leading-none">
          {spec.iso2 ? flagEmoji(spec.iso2) : <span className="size-6 rounded-md border-2 border-ink-3" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{spec.country}</span>
          <span className="block truncate text-[13px] text-ink-2">{spec.title}</span>
        </span>
        <span className="text-[13px] text-ink-2 tabular-nums">{sizeLabel(spec)}</span>
        <span className="w-5">{selected && <Check size={18} className="text-accent" strokeWidth={2.5} />}</span>
      </button>
    </li>
  )
}

export function Requirements({ spec }: { spec: PhotoSpec }) {
  const rows: [string, string][] = [
    ['Photo size', sizeLabel(spec)],
    ['Head height', `${spec.head[0]}–${spec.head[1]} mm, chin to crown`],
  ]
  if (spec.eyeFromBottom) rows.push(['Eye line', `${spec.eyeFromBottom[0]}–${spec.eyeFromBottom[1]} mm from bottom`])
  if (spec.topMargin) rows.push(['Above head', `${spec.topMargin[0]}–${spec.topMargin[1]} mm`])
  rows.push(['Background', spec.backgroundName])
  if (spec.maxKb) rows.push(['Upload limit', `${spec.maxKb} KB`])
  return (
    <div>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2 text-[14px]">
            <dt className="text-ink-2">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] leading-snug text-ink-2">
        {spec.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  )
}

function Summary({ spec, onContinue }: { spec: PhotoSpec; onContinue: () => void }) {
  const image = usePhoto((s) => s.image)
  const [thumb, setThumb] = useState<string | null>(null)
  useEffect(() => {
    if (!image) return
    setThumb(image.canvas.toDataURL('image/jpeg', 0.7))
  }, [image])

  return (
    <div className="rounded-[22px] bg-surface p-5">
      <div className="flex items-center gap-3">
        {thumb && <img src={thumb} alt="Your photo" className="size-14 rounded-xl object-cover" />}
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">
            {flagEmoji(spec.iso2)} {spec.country}
          </p>
          <p className="truncate text-[14px] text-ink-2">{spec.title}</p>
        </div>
      </div>
      <div className="mt-4">
        <Requirements spec={spec} />
      </div>
      <Button size="lg" className="mt-5 w-full" onClick={onContinue}>
        Continue
      </Button>
    </div>
  )
}

function CustomSizeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chooseCustom = usePassport((s) => s.chooseCustom)
  const current = usePassport((s) => s.custom)
  const [unit, setUnit] = useState<'mm' | 'in'>('mm')
  const [w, setW] = useState(String(current?.widthMm ?? 35))
  const [h, setH] = useState(String(current?.heightMm ?? 45))
  const factor = unit === 'in' ? 25.4 : 1
  const wm = Number(w) * factor
  const hm = Number(h) * factor
  const valid = wm >= 10 && hm >= 10 && wm <= 200 && hm <= 200

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Custom size"
      footer={
        <Button
          className="w-full"
          disabled={!valid}
          onClick={() => {
            chooseCustom(Math.round(wm * 10) / 10, Math.round(hm * 10) / 10)
            onClose()
          }}
        >
          Use this size
        </Button>
      }
    >
      <Segmented
        label="Unit"
        value={unit}
        options={[
          { value: 'mm', label: 'Millimetres' },
          { value: 'in', label: 'Inches' },
        ]}
        onChange={(u) => {
          const f = u === 'in' ? 1 / 25.4 : 25.4
          if (u !== unit) {
            setW(String(Math.round(Number(w) * f * 100) / 100))
            setH(String(Math.round(Number(h) * f * 100) / 100))
          }
          setUnit(u)
        }}
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          ['Width', w, setW],
          ['Height', h, setH],
        ].map(([label, value, set]) => (
          <label key={label as string} className="block">
            <span className="mb-1 block text-[13px] text-ink-2">{label as string}</span>
            <input
              inputMode="decimal"
              value={value as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value.replace(/[^\d.]/g, ''))}
              className="h-11 w-full rounded-xl bg-surface-2 px-3.5 text-[17px] tabular-nums outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-ink-2">
        {valid ? 'Head height is scaled from the ICAO standard. Adjust the fit on the next screen.' : 'Enter a size between 10 and 200 mm.'}
      </p>
    </Sheet>
  )
}
