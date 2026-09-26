import { describe, expect, it } from 'vitest'
import { autoCrop, measure, planPlacement } from '../src/lib/passport/autoCrop'
import { SPECS, getSpec } from '../src/data/specs'
import type { FaceGeometry } from '../src/types'

function face(crownY: number, chinY: number, eyeY: number, cx = 1000): FaceGeometry {
  const eye = { x: cx, y: eyeY }
  return {
    eye,
    leftEye: { x: cx - 60, y: eyeY },
    rightEye: { x: cx + 60, y: eyeY },
    chin: { x: cx, y: chinY },
    crown: { x: cx, y: crownY },
    centerX: cx,
    faceWidth: 300,
    rollDeg: 0,
    yaw: 0,
    eyesOpen: 1,
    mouthClosed: 1,
    neutral: 1,
    faceCount: 1,
  }
}

const within = (v: number, [lo, hi]: readonly [number, number], tol = 0.05) => v >= lo - tol && v <= hi + tol

describe('autoCrop', () => {
  const f = face(400, 900, 640) // eyes 48% down the head

  it('meets head, eye and top-margin rules for every spec', () => {
    for (const spec of SPECS) {
      const crop = autoCrop(f, spec)
      const m = measure(f, crop, spec, 1000)
      expect(within(m.headMm, spec.head), `${spec.id} head ${m.headMm}`).toBe(true)
      if (spec.eyeFromBottom) expect(within(m.eyeFromBottomMm, spec.eyeFromBottom), `${spec.id} eyes ${m.eyeFromBottomMm}`).toBe(true)
      if (spec.topMargin) expect(within(m.topMarginMm, spec.topMargin), `${spec.id} top ${m.topMarginMm}`).toBe(true)
      expect(m.topMarginMm, `${spec.id} crown inside`).toBeGreaterThan(1)
      expect(Math.abs(m.centerOffsetMm)).toBeLessThan(0.01)
    }
  })

  it('keeps the crop at the spec aspect ratio', () => {
    const spec = getSpec('cn-visa')!
    const crop = autoCrop(f, spec)
    expect(crop.width / crop.height).toBeCloseTo(spec.widthMm / spec.heightMm, 6)
  })

  it('places US photos with eyes 28–35 mm from the bottom', () => {
    const spec = getSpec('us-passport')!
    const plan = planPlacement(spec, 0.48)
    expect(plan.eyeFromBottomMm).toBeGreaterThanOrEqual(28)
    expect(plan.eyeFromBottomMm).toBeLessThanOrEqual(35)
  })
})
