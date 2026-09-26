import type { FaceGeometry, PhotoSpec, Rect } from '../../types'

/** Where the head should sit on the finished photo, in mm. */
export interface Placement {
  headMm: number
  eyeFromBottomMm: number
  topMarginMm: number
}

const mid = (r: readonly [number, number]) => (r[0] + r[1]) / 2
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Minimum room above the hair when a spec does not say otherwise. */
const DEFAULT_MIN_TOP_MM = 1.5

/**
 * Pick head size and eye height that satisfy the spec for a face whose eyes sit
 * `eyeRatio` of the way down from crown to chin (usually ~0.45–0.5).
 */
export function planPlacement(spec: PhotoSpec, eyeRatio: number): Placement {
  const H = spec.heightMm
  const r = clamp(eyeRatio, 0.3, 0.7)
  let h = mid(spec.head)
  let e: number

  if (spec.eyeFromBottom) e = mid(spec.eyeFromBottom)
  else if (spec.topMargin) e = H - mid(spec.topMargin) - r * h
  else e = H - (H - h) * 0.42 - r * h

  const top = () => H - e - r * h
  const minTop = spec.topMargin?.[0] ?? DEFAULT_MIN_TOP_MM
  const maxTop = spec.topMargin?.[1]

  if (top() < minTop) {
    // Lower the eyes first, then shrink the head, staying inside the allowed ranges.
    const eMin = spec.eyeFromBottom?.[0] ?? -Infinity
    e = Math.max(eMin, H - minTop - r * h)
    if (top() < minTop) h = Math.max(spec.head[0], (H - minTop - e) / r)
  }
  if (maxTop !== undefined && top() > maxTop) {
    const eMax = spec.eyeFromBottom?.[1] ?? Infinity
    e = Math.min(eMax, H - maxTop - r * h)
  }

  return { headMm: h, eyeFromBottomMm: e, topMarginMm: top() }
}

export function eyeRatioOf(face: FaceGeometry): number {
  return (face.eye.y - face.crown.y) / Math.max(1, face.chin.y - face.crown.y)
}

/** Crop rectangle (source pixels) that places the face according to the spec. */
export function autoCrop(face: FaceGeometry, spec: PhotoSpec): Rect {
  const plan = planPlacement(spec, eyeRatioOf(face))
  const pxPerMm = (face.chin.y - face.crown.y) / plan.headMm
  const width = spec.widthMm * pxPerMm
  const height = spec.heightMm * pxPerMm
  return {
    x: face.centerX - width / 2,
    y: face.eye.y - (spec.heightMm - plan.eyeFromBottomMm) * pxPerMm,
    width,
    height,
  }
}

export interface Measurements {
  headMm: number
  eyeFromBottomMm: number
  topMarginMm: number
  /** Positive when the face is right of centre. */
  centerOffsetMm: number
  /** Output pixels per source pixel; above 1 means the photo is being enlarged. */
  upscale: number
}

export function measure(face: FaceGeometry, crop: Rect, spec: PhotoSpec, outHeightPx: number): Measurements {
  const pxPerMm = crop.height / spec.heightMm
  return {
    headMm: (face.chin.y - face.crown.y) / pxPerMm,
    eyeFromBottomMm: (crop.y + crop.height - face.eye.y) / pxPerMm,
    topMarginMm: (face.crown.y - crop.y) / pxPerMm,
    centerOffsetMm: (face.centerX - (crop.x + crop.width / 2)) / pxPerMm,
    upscale: outHeightPx / crop.height,
  }
}
