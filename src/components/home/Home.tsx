import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { TopBar } from '../layout/TopBar'
import { Button } from '../ui/Button'
import { SpecCard } from './SpecCard'
import { useApp } from '../../store/app'
import { openPhoto } from '../../lib/start'
import { SPECS } from '../../data/specs'
import { preloadBackgroundModel } from '../../lib/ml/removeBackground'
import { preloadFaceModel } from '../../lib/ml/face'

const countryCount = new Set(SPECS.filter((s) => s.iso2).map((s) => s.country)).size

export function Home() {
  const go = useApp((s) => s.go)
  const setStep = useApp((s) => s.setPassportStep)
  const [dragging, setDragging] = useState(false)

  // Dropping a photo anywhere on the home page starts a passport photo.
  useEffect(() => {
    let depth = 0
    const enter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return
      depth++
      setDragging(true)
    }
    const leave = () => {
      depth = Math.max(0, depth - 1)
      if (!depth) setDragging(false)
    }
    const over = (e: DragEvent) => e.preventDefault()
    const drop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragging(false)
      const file = e.dataTransfer?.files[0]
      if (file) void openPhoto(file, 'passport')
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [])

  const startPassport = () => {
    preloadFaceModel()
    preloadBackgroundModel()
    setStep('photo')
    go('passport')
  }

  return (
    <>
      <TopBar
        right={
          <span className="hidden items-center gap-1.5 text-[13px] text-ink-2 sm:flex">
            <ShieldCheck size={15} className="text-good" />
            Photos never leave your device
          </span>
        }
      />

      <main className="flex-1">
        <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 pt-12 pb-16 sm:px-8 md:grid-cols-[1.05fr_1fr] md:pt-20 md:pb-24">
          <div className="max-w-xl">
            <h1 className="font-display text-[44px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-[60px]">
              Passport photos, done right.
            </h1>
            <p className="mt-5 max-w-[34ch] text-[19px] leading-[1.45] text-ink-2 sm:text-[21px]">
              Take or upload a photo. Pixport removes the background, sizes your head to the millimetre and lays out a print sheet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={startPassport}>
                Make a passport photo
              </Button>
              <Button size="lg" variant="secondary" onClick={() => go('editor')}>
                Edit a photo
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-ink-3">Or drop a photo anywhere on this page.</p>
          </div>
          <SpecCard />
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
            <Feature title={`${countryCount} countries, ${SPECS.length} documents`}>
              Passports, visas and ID cards, each with its own size, head height and background. Or set a custom size.
            </Feature>
            <Feature title="Checked before you print">
              Head size, eye height, tilt, expression and background are measured against the rules, with a clear fix for anything off.
            </Feature>
            <Feature title="Print at home or at a shop">
              Download the digital photo at the exact pixel size, or a 4×6, 5×7, A4 or Letter sheet as JPEG or PDF.
            </Feature>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
          <div className="grid items-center gap-8 rounded-[28px] bg-surface p-8 sm:grid-cols-[1fr_auto] sm:p-10">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.025em]">Need a quick edit instead?</h2>
              <p className="mt-2 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">
                Remove or replace a background, blur it, crop and straighten, tune light and colour, or apply a filter. Save as PNG with transparency, JPEG or WebP.
              </p>
            </div>
            <Button size="lg" variant="secondary" onClick={() => go('editor')}>
              Open the editor
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-center text-[12px] leading-relaxed text-ink-3">
        <p>Pixport runs entirely in your browser. No uploads, no accounts.</p>
        <p>Requirements change — check with the issuing office before you submit.</p>
      </footer>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-accent/10 backdrop-blur-sm">
          <div className="rounded-3xl bg-surface px-8 py-6 text-[19px] font-medium shadow-soft">Drop to make a passport photo</div>
        </div>
      )}
    </>
  )
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[17px] font-semibold tracking-[-0.015em]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{children}</p>
    </div>
  )
}
