import { useDeferredValue, useEffect, useMemo } from 'react'
import { usePhoto } from '../../store/photo'
import { activeSpec, usePassport } from '../../store/passport'
import { specPixels } from '../../data/specs'
import { prepareMask, preparePassportCanvas } from '../../lib/passport/prepare'
import { geometryFor, rollOf, type FaceScan } from '../../lib/ml/face'
import { autoCrop, eyeRatioOf, measure, planPlacement } from '../../lib/passport/autoCrop'
import { runChecks, summarize } from '../../lib/passport/compliance'
import type { PhotoSpec, Rect } from '../../types'

/** Scans that have already been auto-levelled, so a manual 0° is respected afterwards. */
const leveled = new WeakSet<FaceScan>()

function centreCrop(w: number, h: number, spec: PhotoSpec): Rect {
  const aspect = spec.widthMm / spec.heightMm
  const height = Math.min(h, w / aspect)
  const width = height * aspect
  return { x: (w - width) / 2, y: (h - height) / 2, width, height }
}

const close = (a: Rect | null, b: Rect) =>
  !!a && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1

/** Everything the passport screens derive from the photo, spec and edits. */
export function usePassportModel() {
  const image = usePhoto((s) => s.image)
  const cutout = usePhoto((s) => s.cutout)
  const scan = usePhoto((s) => s.scan)
  const scanStatus = usePhoto((s) => s.scanStatus)
  const cutoutStatus = usePhoto((s) => s.cutoutStatus)

  const specId = usePassport((s) => s.specId)
  const custom = usePassport((s) => s.custom)
  const useCutoutPref = usePassport((s) => s.useCutout)
  const bgPref = usePassport((s) => s.background)
  const adjust = useDeferredValue(usePassport((s) => s.adjust))
  const straighten = useDeferredValue(usePassport((s) => s.straighten))
  const crop = usePassport((s) => s.crop)
  const cropAuto = usePassport((s) => s.cropAuto)

  const spec = useMemo(() => activeSpec({ specId, custom }), [specId, custom])
  const background = bgPref ?? spec.background
  const useCutout = useCutoutPref && !!cutout
  const out = specPixels(spec)

  const prepared = useMemo(
    () =>
      image
        ? preparePassportCanvas({ original: image.canvas, cutout, useCutout, background, adjust, straightenDeg: straighten })
        : null,
    [image, cutout, useCutout, background, adjust, straighten],
  )

  const mask = useMemo(() => prepareMask(cutout, straighten), [cutout, straighten])

  const face = useMemo(
    () => (scan && image ? geometryFor(scan, image.canvas.width, image.canvas.height, straighten, mask) : null),
    [scan, image, straighten, mask],
  )

  // Level the head once, as soon as the face is found.
  useEffect(() => {
    if (!scan || leveled.has(scan)) return
    leveled.add(scan)
    const roll = rollOf(scan)
    if (Math.abs(roll) >= 0.6 && Math.abs(roll) <= 20) {
      usePassport.getState().set({ straighten: -Math.round(roll * 10) / 10 })
    }
  }, [scan])

  // Keep the crop on the face until the person moves it themselves.
  const scanSettled = scanStatus === 'done' || scanStatus === 'error'
  useEffect(() => {
    if (!prepared || !cropAuto) return
    if (!face && !scanSettled) return
    // Wait for the cut-out when it is coming: it finds the true top of the hair.
    if (face && cutoutStatus === 'working') {
      if (crop) return
    }
    const next = face ? autoCrop(face, spec) : centreCrop(prepared.width, prepared.height, spec)
    if (!close(crop, next)) usePassport.getState().setCrop(next, false)
  }, [prepared, face, spec, cropAuto, crop, scanSettled, cutoutStatus])

  const m = face && crop ? measure(face, crop, spec, out.height) : null
  const checks = runChecks({ spec, face, m, rollDeg: face?.rollDeg ?? 0, backgroundReplaced: useCutout })
  const plan = planPlacement(spec, face ? eyeRatioOf(face) : 0.47)

  return {
    spec,
    background,
    useCutout,
    prepared,
    face,
    crop,
    checks,
    summary: summarize(checks),
    plan,
    outPx: out,
  }
}
