import { describe, expect, it } from 'vitest'
import { PAPERS, cellPositions, computeLayout } from '../src/lib/print/layout'

const paper = (id: string) => PAPERS.find((p) => p.id === id)!

describe('print layout', () => {
  it('fits eight 35×45 photos on a 4×6 in sheet by turning them sideways', () => {
    const l = computeLayout(paper('4x6'), 35, 45)
    expect(l.rotated).toBe(true)
    expect(l.capacity).toBe(8)
    expect(l.count).toBe(8)
  })

  it('fits two 2×2 in photos on a 4×6 in sheet', () => {
    const l = computeLayout(paper('4x6'), 50.8, 50.8)
    expect(l.capacity).toBe(2)
  })

  it('keeps every photo inside the paper', () => {
    for (const p of PAPERS) {
      const l = computeLayout(p, 35, 45)
      for (const c of cellPositions(l)) {
        expect(c.x).toBeGreaterThanOrEqual(0)
        expect(c.y).toBeGreaterThanOrEqual(0)
        expect(c.x + l.cellWidthMm).toBeLessThanOrEqual(p.widthMm)
        expect(c.y + l.cellHeightMm).toBeLessThanOrEqual(p.heightMm)
      }
    }
  })

  it('keeps photos upright when rotating gains nothing', () => {
    expect(computeLayout(paper('4x6'), 50.8, 50.8).rotated).toBe(false)
  })

  it('honours a requested count', () => {
    expect(computeLayout(paper('a4'), 35, 45, 4).count).toBe(4)
    expect(computeLayout(paper('4x6'), 35, 45, 99).count).toBe(8)
  })
})
