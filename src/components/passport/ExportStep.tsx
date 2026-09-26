import { useMemo, useState } from 'react'
import { Download, FileImage, FileText, Printer } from 'lucide-react'
import { Studio, Panel } from '../layout/Studio'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'
import { Spinner } from '../ui/Progress'
import { ComplianceList } from './ComplianceList'
import { sizeLabel } from './DocumentStep'
import { usePassportModel } from './usePassportModel'
import { usePassport } from '../../store/passport'
import { usePhoto } from '../../store/photo'
import { useApp } from '../../store/app'
import { useCanvasUrl } from '../../hooks/useCanvasUrl'
import { renderPassport } from '../../lib/passport/prepare'
import { PAPERS, computeLayout } from '../../lib/print/layout'
import { renderSheet, sheetToJpeg, sheetToPdf } from '../../lib/print/render'
import { encodeJpeg, fitJpegUnderKb, formatBytes, withJpegDpi, withPngDpi } from '../../lib/image/export'
import { canvasToBlob, downloadBlob } from '../../lib/image/canvas'

type View = 'photo' | 'sheet'

/** Sheets are previewed at a lower resolution; downloads are rendered at full 300 dpi. */
const PREVIEW_DPI = 90

export function ExportStep() {
  const model = usePassportModel()
  const { spec, prepared, crop, background } = model
  const paperId = usePassport((s) => s.paperId)
  const sheetCount = usePassport((s) => s.sheetCount)
  const set = usePassport((s) => s.set)
  const name = usePhoto((s) => s.image?.name ?? 'photo')
  const toast = useApp((s) => s.toast)
  const [view, setView] = useState<View>('photo')
  const [busy, setBusy] = useState<string | null>(null)

  const photo = useMemo(
    () => (prepared && crop ? renderPassport(prepared, crop, spec, background) : null),
    [prepared, crop, spec, background],
  )
  const paper = PAPERS.find((p) => p.id === paperId) ?? PAPERS[0]
  const layout = computeLayout(paper, spec.widthMm, spec.heightMm, sheetCount ?? undefined)
  const sheetPreview = useMemo(
    () => (photo && layout.capacity ? renderSheet(photo, paper, layout, PREVIEW_DPI) : null),
    [photo, paper, layout.count, layout.capacity],
  )
  const photoUrl = useCanvasUrl(photo)
  const sheetUrl = useCanvasUrl(sheetPreview)

  const base = `${name}-${spec.id}`

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    try {
      await fn()
    } catch (err) {
      console.error(err)
      toast('Saving failed. Try again, or try a different format.', 'error')
    } finally {
      setBusy(null)
    }
  }

  const saveJpeg = () =>
    run('jpeg', async () => {
      if (!photo) return
      let blob: Blob
      if (spec.maxKb) {
        const r = await fitJpegUnderKb((q) => encodeJpeg(photo, q), spec.maxKb)
        blob = r.blob
      } else {
        blob = await encodeJpeg(photo, 0.95)
      }
      blob = await withJpegDpi(blob, spec.dpi)
      downloadBlob(blob, `${base}.jpg`)
      toast(`Saved ${base}.jpg (${formatBytes(blob.size)})`, 'success')
    })

  const savePng = () =>
    run('png', async () => {
      if (!photo) return
      const blob = await withPngDpi(await canvasToBlob(photo, 'image/png'), spec.dpi)
      downloadBlob(blob, `${base}.png`)
      toast(`Saved ${base}.png`, 'success')
    })

  const saveSheet = (kind: 'jpeg' | 'pdf') =>
    run(`sheet-${kind}`, async () => {
      if (!photo) return
      const sheet = renderSheet(photo, paper, layout, 300)
      const blob = kind === 'pdf' ? await sheetToPdf(sheet, paper) : await sheetToJpeg(sheet, 300)
      const file = `${base}-${paper.id}-sheet.${kind === 'pdf' ? 'pdf' : 'jpg'}`
      downloadBlob(blob, file)
      toast(`Saved ${file}`, 'success')
    })

  return (
    <Studio
      stage={
        <div className="flex size-full flex-col items-center justify-center gap-5 p-6">
          <div className="absolute top-4 sm:top-6">
            <Segmented
              label="Preview"
              size="sm"
              className="w-56 bg-glass shadow-soft backdrop-blur-xl"
              value={view}
              onChange={setView}
              options={[
                { value: 'photo', label: 'Photo' },
                { value: 'sheet', label: 'Print sheet' },
              ]}
            />
          </div>
          {view === 'photo' && photoUrl && (
            <img
              src={photoUrl}
              alt="Finished passport photo"
              className="max-h-[min(60dvh,560px)] w-auto rounded-[3px] shadow-[0_18px_50px_rgb(0_0_0/0.22)]"
              style={{ aspectRatio: `${spec.widthMm} / ${spec.heightMm}`, maxWidth: '70%' }}
            />
          )}
          {view === 'sheet' && sheetUrl && (
            <img
              src={sheetUrl}
              alt={`${layout.count} photos on a ${paper.label} sheet`}
              className="max-h-[min(66dvh,640px)] w-auto max-w-[90%] rounded-[3px] shadow-[0_18px_50px_rgb(0_0_0/0.22)]"
            />
          )}
          <p className="text-[13px] text-ink-2 tabular-nums">
            {view === 'photo'
              ? `${sizeLabel(spec)} · ${model.outPx.width} × ${model.outPx.height} px · ${spec.dpi} dpi`
              : `${layout.count} photos · ${paper.label}`}
          </p>
        </div>
      }
      inspector={
        <>
          <Panel>
            <ComplianceList checks={model.checks} summary={model.summary} collapsible />
          </Panel>

          <Panel title="Digital photo">
            <p className="mb-3 text-[13px] leading-relaxed text-ink-2">
              For online applications.
              {spec.maxKb ? ` The JPEG is compressed to fit the ${spec.maxKb} KB limit.` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveJpeg} disabled={!photo || !!busy}>
                {busy === 'jpeg' ? <Spinner /> : <Download size={16} />}
                Download JPEG
              </Button>
              <Button variant="secondary" onClick={savePng} disabled={!photo || !!busy}>
                {busy === 'png' ? <Spinner /> : <FileImage size={16} />}
                PNG
              </Button>
            </div>
          </Panel>

          <Panel title="Print sheet">
            <Segmented
              label="Paper size"
              value={paper.id}
              onChange={(id) => {
                set({ paperId: id, sheetCount: null })
                setView('sheet')
              }}
              options={PAPERS.map((p) => ({ value: p.id, label: p.label }))}
              size="sm"
            />
            {layout.capacity > 1 && (
              <div className="mt-5">
                <Slider
                  label="Photos on the sheet"
                  value={layout.count}
                  min={1}
                  max={layout.capacity}
                  centered={false}
                  onChange={(v) => {
                    set({ sheetCount: v })
                    setView('sheet')
                  }}
                />
              </div>
            )}
            {layout.capacity === 0 && <p className="mt-3 text-[13px] text-bad">This photo is larger than the paper. Pick a bigger sheet.</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => saveSheet('pdf')} disabled={!photo || !!busy || !layout.capacity}>
                {busy === 'sheet-pdf' ? <Spinner /> : <FileText size={16} />}
                Download PDF
              </Button>
              <Button variant="secondary" onClick={() => saveSheet('jpeg')} disabled={!photo || !!busy || !layout.capacity}>
                {busy === 'sheet-jpeg' ? <Spinner /> : <Printer size={16} />}
                JPEG
              </Button>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
              Print at 100% or “actual size” — never “fit to page”. Photo shops can print the 4 × 6 in JPEG directly.
            </p>
          </Panel>
        </>
      }
    />
  )
}
