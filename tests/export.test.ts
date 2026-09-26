import { describe, expect, it } from 'vitest'
import { fitJpegUnderKb, setJpegDpi } from '../src/lib/image/export'

describe('fitJpegUnderKb', () => {
  // Fake encoder: size grows linearly with quality, 1000 KB at q=1.
  const encode = async (q: number) => new Blob([new Uint8Array(Math.round(q * 1000 * 1024))])

  it('returns top quality when already small enough', async () => {
    const r = await fitJpegUnderKb(encode, 2000)
    expect(r.quality).toBe(0.95)
  })

  it('finds a quality under the limit', async () => {
    const r = await fitJpegUnderKb(encode, 240)
    expect(r.blob.size).toBeLessThanOrEqual(240 * 1024)
    expect(r.quality).toBeGreaterThan(0.2)
  })
})

describe('setJpegDpi', () => {
  it('writes density into an existing JFIF header', () => {
    const jfif = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9])
    const out = setJpegDpi(jfif, 300)
    expect(out[13]).toBe(1)
    expect((out[14] << 8) | out[15]).toBe(300)
    expect((out[16] << 8) | out[17]).toBe(300)
    expect(out.length).toBe(jfif.length)
  })

  it('inserts a JFIF header when missing', () => {
    const bare = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 2, 0xff, 0xd9])
    const out = setJpegDpi(bare, 300)
    expect(out.length).toBe(bare.length + 18)
    expect([out[2], out[3]]).toEqual([0xff, 0xe0])
    expect((out[14] << 8) | out[15]).toBe(300)
  })
})
