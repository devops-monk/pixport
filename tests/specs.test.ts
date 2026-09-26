import { describe, expect, it } from 'vitest'
import { SPECS, customSpec, specPixels } from '../src/data/specs'

describe('specs', () => {
  it('has unique ids', () => {
    expect(new Set(SPECS.map((s) => s.id)).size).toBe(SPECS.length)
  })

  it('has sane values', () => {
    for (const s of SPECS) {
      expect(s.head[0], s.id).toBeLessThan(s.head[1])
      expect(s.head[1], s.id).toBeLessThan(s.heightMm)
      expect(s.background, s.id).toMatch(/^#[0-9a-f]{6}$/i)
      if (s.eyeFromBottom) expect(s.eyeFromBottom[1], s.id).toBeLessThan(s.heightMm)
    }
  })

  it('converts 2×2 in to 600×600 px and 35×45 mm to 413×531 px', () => {
    expect(specPixels(SPECS.find((s) => s.id === 'us-passport')!)).toEqual({ width: 600, height: 600 })
    expect(specPixels(SPECS.find((s) => s.id === 'generic-35x45')!)).toEqual({ width: 413, height: 531 })
  })

  it('scales head height for custom sizes', () => {
    const c = customSpec(45, 90)
    expect(c.head).toEqual([64, 72])
  })
})
