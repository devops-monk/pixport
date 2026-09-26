import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import clsx from 'clsx'
import { RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { Studio, Panel } from '../layout/Studio'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'
import { Swatch, CustomSwatch } from '../ui/Swatch'
import { ProgressRing } from '../ui/Progress'
import { ComplianceList } from './ComplianceList'
import { usePassportModel } from './usePassportModel'
import { usePassport } from '../../store/passport'
import { usePhoto } from '../../store/photo'
import { useApp } from '../../store/app'
import { useCanvasUrl } from '../../hooks/useCanvasUrl'
import { NEUTRAL } from '../../lib/image/adjust'
import type { Placement } from '../../lib/passport/autoCrop'
import type { Adjustments, PhotoSpec, Rect } from '../../types'

type Tab = 'fit' | 'background' | 'light'

export function AdjustStep() {
  const model = usePassportModel()
  const [tab, setTab] = useState<Tab>('fit')
  const [zoom, setZoom] = useState(1)
  const [guides, setGuides] = useState(true)
  const setStep = useApp((s) => s.setPassportStep)

  return (
    <Studio
      stage={<CropStage model={model} zoom={zoom} setZoom={setZoom} guides={guides} />}
      inspector={
        <>
          <Panel>
            <ComplianceList checks={model.checks} summary={model.summary} collapsible />
          </Panel>
          <div className="px-5 pt-5">
            <Segmented
              label="Adjustment"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'fit', label: 'Fit' },
                { value: 'background', label: 'Background' },
                { value: 'light', label: 'Light' },
              ]}
            />
          </div>
          {tab === 'fit' && <FitPanel zoom={zoom} setZoom={setZoom} guides={guides} setGuides={setGuides} />}
          {tab === 'background' && <BackgroundPanel spec={model.spec} background={model.background} />}
          {tab === 'light' && <LightPanel />}
          <div className="sticky bottom-0 border-t border-line bg-surface/90 px-5 py-4 backdrop-blur-xl">
            <Button size="lg" className="w-full" disabled={!model.crop} onClick={() => setStep('export')}>
              Continue
            </Button>
          </div>
        </>
      }
    />
  )
}

type Model = ReturnType<typeof usePassportModel>

function CropStage({ model, zoom, setZoom, guides }: { model: Model; zoom: number; setZoom: (z: number) => void; guides: boolean }) {
  const url = useCanvasUrl(model.prepared)
  const cropVersion = usePassport((s) => s.cropVersion)
  const setCrop = usePassport((s) => s.setCrop)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null)
  const aspect = model.spec.widthMm / model.spec.heightMm

  const onComplete = useCallback(
    (_: Area, px: Area) => {
      const cur = usePassport.getState().crop
      // Mounting with a preset crop echoes it back; only real moves count as manual.
      if (cur && Math.abs(cur.x - px.x) <= 2 && Math.abs(cur.y - px.y) <= 2 && Math.abs(cur.width - px.width) <= 2) return
      setCrop(px as Rect, true)
    },
    [setCrop],
  )

  return (
    <div className="absolute inset-0">
      {url && model.crop && (
        <div className="absolute inset-3 overflow-hidden rounded-[18px] sm:inset-6">
          <Cropper
            key={cropVersion}
            image={url}
            aspect={aspect}
            crop={pos}
            zoom={zoom}
            minZoom={0.3}
            maxZoom={6}
            zoomSpeed={0.25}
            restrictPosition={false}
            showGrid={false}
            objectFit="contain"
            initialCroppedAreaPixels={model.crop}
            onCropChange={setPos}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            onCropSizeChange={setCropSize}
            style={{ containerStyle: { background: model.background } }}
          />
          {guides && cropSize && <Guides spec={model.spec} plan={model.plan} size={cropSize} />}
        </div>
      )}
      <StatusPill />
    </div>
  )
}

/** Head oval and eye line drawn in millimetres over the crop frame. */
function Guides({ spec, plan, size }: { spec: PhotoSpec; plan: Placement; size: { width: number; height: number } }) {
  const W = spec.widthMm
  const H = spec.heightMm
  const crown = plan.topMarginMm
  const head = plan.headMm
  const eyeY = H - plan.eyeFromBottomMm
  const minHead = spec.head[0]
  const maxHead = spec.head[1]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size.width, height: size.height }}
      aria-hidden="true"
    >
      <g fill="none" vectorEffect="non-scaling-stroke">
        {/* Allowed head sizes: inner and outer ovals share the chin. */}
        <ellipse cx={W / 2} cy={crown + head - maxHead / 2} rx={maxHead * 0.37} ry={maxHead / 2} stroke="white" strokeOpacity={0.35} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <ellipse cx={W / 2} cy={crown + head - minHead / 2} rx={minHead * 0.37} ry={minHead / 2} stroke="white" strokeOpacity={0.35} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <ellipse cx={W / 2} cy={crown + head / 2} rx={head * 0.37} ry={head / 2} stroke="white" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <line x1={0} x2={W} y1={eyeY} y2={eyeY} stroke="#5ac8fa" strokeWidth={1.25} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
        <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="white" strokeOpacity={0.3} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}

function StatusPill() {
  const scanStatus = usePhoto((s) => s.scanStatus)
  const cutoutStatus = usePhoto((s) => s.cutoutStatus)
  const phase = usePhoto((s) => s.cutoutPhase)
  const progress = usePhoto((s) => s.cutoutProgress)
  const error = usePhoto((s) => s.cutoutError)
  const retry = usePhoto((s) => s.ensureCutout)
  const useCutout = usePassport((s) => s.useCutout)

  let content: React.ReactNode = null
  if (scanStatus === 'working') {
    content = (
      <>
        <ProgressRing value={null} size={18} /> Finding your face…
      </>
    )
  } else if (cutoutStatus === 'working' && useCutout) {
    const pct = Math.round(progress * 100)
    content = (
      <>
        <ProgressRing value={phase === 'download' ? progress : null} size={18} />
        {phase === 'download' ? `Getting the background tool ready… ${pct}%` : 'Removing the background…'}
      </>
    )
  } else if (cutoutStatus === 'error' && useCutout) {
    content = (
      <>
        <span className="text-bad">{error}</span>
        <button type="button" className="ml-1 font-medium text-accent" onClick={() => void retry()}>
          Try again
        </button>
      </>
    )
  } else if (scanStatus === 'done' && !usePhoto.getState().scan) {
    content = <span>No face found — position the photo by hand.</span>
  }

  if (!content) return null
  return (
    <div className="absolute inset-x-0 top-4 z-10 flex justify-center px-4 sm:top-8">
      <div className="flex max-w-md items-center gap-2 rounded-full bg-glass px-4 py-2 text-[13px] shadow-soft ring-1 ring-line backdrop-blur-2xl">
        {content}
      </div>
    </div>
  )
}

function FitPanel({
  zoom,
  setZoom,
  guides,
  setGuides,
}: {
  zoom: number
  setZoom: (z: number) => void
  guides: boolean
  setGuides: (g: boolean) => void
}) {
  const straighten = usePassport((s) => s.straighten)
  const set = usePassport((s) => s.set)
  const autoFit = usePassport((s) => s.autoFit)
  const cropAuto = usePassport((s) => s.cropAuto)
  return (
    <Panel>
      <div className="space-y-5">
        <p className="text-[13px] leading-relaxed text-ink-2">
          Drag the photo to move it. Pinch, scroll or use the slider to resize. Line your eyes up with the blue line and your head
          inside the dashed oval.
        </p>
        <Slider
          label="Size"
          value={Math.round(zoom * 100)}
          min={30}
          max={600}
          centered={false}
          format={(v) => `${v}%`}
          onChange={(v) => setZoom(v / 100)}
        />
        <Slider
          label="Straighten"
          value={straighten}
          min={-15}
          max={15}
          step={0.1}
          format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}°`}
          onChange={(v) => set({ straighten: v })}
          resetTo={0}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={autoFit} disabled={cropAuto}>
            <Wand2 size={15} />
            {cropAuto ? 'Auto-fitted' : 'Auto-fit'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setGuides(!guides)} aria-pressed={guides}>
            {guides ? 'Hide guides' : 'Show guides'}
          </Button>
        </div>
      </div>
    </Panel>
  )
}

const COLORS = [
  { color: '#ffffff', name: 'White' },
  { color: '#f4f4f1', name: 'Off-white' },
  { color: '#eeeeee', name: 'Light grey' },
  { color: '#e1e4e8', name: 'Grey-blue' },
  { color: '#dbe9f7', name: 'Light blue' },
  { color: '#3b82c4', name: 'Blue' },
  { color: '#d0312d', name: 'Red' },
]

function BackgroundPanel({ spec, background }: { spec: PhotoSpec; background: string }) {
  const useCutout = usePassport((s) => s.useCutout)
  const set = usePassport((s) => s.set)
  const cutoutStatus = usePhoto((s) => s.cutoutStatus)
  const ensureCutout = usePhoto((s) => s.ensureCutout)
  const colors = COLORS.some((c) => c.color === spec.background)
    ? COLORS
    : [{ color: spec.background, name: spec.backgroundName }, ...COLORS]
  const isRequired = background.toLowerCase() === spec.background.toLowerCase()

  return (
    <Panel>
      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-[15px] font-medium">Replace background</span>
          <span className="block text-[13px] text-ink-2">
            {cutoutStatus === 'working' ? 'Working on it…' : cutoutStatus === 'error' ? 'Not available — try again' : 'Cuts you out on this device'}
          </span>
        </span>
        <Toggle
          checked={useCutout}
          onChange={(v) => {
            set({ useCutout: v })
            if (v) void ensureCutout()
          }}
        />
      </label>

      <div className={clsx('mt-5 transition-opacity', !useCutout && 'pointer-events-none opacity-40')}>
        <p className="mb-2 text-[13px] text-ink-2">
          {spec.country} requires <span className="font-medium text-ink">{spec.backgroundName.toLowerCase()}</span>
        </p>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => (
            <Swatch
              key={c.color}
              color={c.color}
              label={c.name}
              selected={background.toLowerCase() === c.color.toLowerCase()}
              onSelect={() => set({ background: c.color })}
            />
          ))}
          <CustomSwatch
            color={background}
            selected={!colors.some((c) => c.color.toLowerCase() === background.toLowerCase())}
            onChange={(c) => set({ background: c })}
          />
        </div>
        {!isRequired && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] text-warn">
            This colour differs from the requirement.
            <button type="button" className="font-medium text-accent" onClick={() => set({ background: null })}>
              Use {spec.backgroundName.toLowerCase()}
            </button>
          </p>
        )}
      </div>
    </Panel>
  )
}

const LIGHT: { key: keyof Adjustments; label: string; min?: number; max?: number }[] = [
  { key: 'exposure', label: 'Exposure' },
  { key: 'brightness', label: 'Brightness' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'saturation', label: 'Saturation' },
  { key: 'warmth', label: 'Warmth' },
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
]

function LightPanel() {
  const adjust = usePassport((s) => s.adjust)
  const set = usePassport((s) => s.set)
  const changed = Object.values(adjust).some((v) => v !== 0)
  return (
    <Panel>
      <div className="mb-4 flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => set({ adjust: { ...NEUTRAL, exposure: 8, contrast: 6, saturation: 4, sharpness: 20 } })}>
          <Sparkles size={15} /> Auto-enhance
        </Button>
        <Button variant="plain" size="sm" disabled={!changed} onClick={() => set({ adjust: NEUTRAL })}>
          <RotateCcw size={15} /> Reset
        </Button>
      </div>
      <div className="space-y-4">
        {LIGHT.map((l) => (
          <Slider
            key={l.key}
            label={l.label}
            value={adjust[l.key]}
            min={l.min}
            max={l.max}
            resetTo={0}
            onChange={(v) => set({ adjust: { ...usePassport.getState().adjust, [l.key]: v } })}
          />
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
        Keep changes subtle. Most offices reject photos that look retouched.
      </p>
    </Panel>
  )
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx('relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200', checked ? 'bg-good' : 'bg-surface-3')}
    >
      <span
        className={clsx(
          'absolute top-[2px] left-[2px] size-[27px] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-300 ease-[var(--ease-spring)]',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
