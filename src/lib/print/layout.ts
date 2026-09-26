export interface Paper {
  id: string
  label: string
  widthMm: number
  heightMm: number
}

export const PAPERS: Paper[] = [
  { id: '4x6', label: '4 × 6 in', widthMm: 101.6, heightMm: 152.4 },
  { id: '5x7', label: '5 × 7 in', widthMm: 127, heightMm: 177.8 },
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  { id: 'letter', label: 'Letter', widthMm: 215.9, heightMm: 279.4 },
]

export const MARGIN_MM = 3
export const GUTTER_MM = 2

export interface SheetLayout {
  cols: number
  rows: number
  /** Photos placed, possibly fewer than cols × rows when a count is requested. */
  count: number
  capacity: number
  /** True when photos are turned 90° to fit more on the sheet. */
  rotated: boolean
  /** Footprint of one photo on the sheet (after rotation). */
  cellWidthMm: number
  cellHeightMm: number
  offsetXMm: number
  offsetYMm: number
}

function fit(paperMm: number, photoMm: number): number {
  return Math.max(0, Math.floor((paperMm - 2 * MARGIN_MM + GUTTER_MM) / (photoMm + GUTTER_MM)))
}

export function computeLayout(paper: Paper, photoWmm: number, photoHmm: number, count?: number): SheetLayout {
  const upright = { cols: fit(paper.widthMm, photoWmm), rows: fit(paper.heightMm, photoHmm) }
  const turned = { cols: fit(paper.widthMm, photoHmm), rows: fit(paper.heightMm, photoWmm) }
  const rotated = turned.cols * turned.rows > upright.cols * upright.rows
  const { cols, rows } = rotated ? turned : upright
  const cellWidthMm = rotated ? photoHmm : photoWmm
  const cellHeightMm = rotated ? photoWmm : photoHmm
  const capacity = cols * rows
  const gridW = cols ? cols * cellWidthMm + (cols - 1) * GUTTER_MM : 0
  const gridH = rows ? rows * cellHeightMm + (rows - 1) * GUTTER_MM : 0
  return {
    cols,
    rows,
    capacity,
    count: count === undefined ? capacity : Math.max(0, Math.min(capacity, count)),
    rotated,
    cellWidthMm,
    cellHeightMm,
    offsetXMm: (paper.widthMm - gridW) / 2,
    offsetYMm: (paper.heightMm - gridH) / 2,
  }
}

/** Top-left of each placed photo, in mm, filled row by row. */
export function cellPositions(layout: SheetLayout): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < layout.count; i++) {
    const col = i % layout.cols
    const row = Math.floor(i / layout.cols)
    out.push({
      x: layout.offsetXMm + col * (layout.cellWidthMm + GUTTER_MM),
      y: layout.offsetYMm + row * (layout.cellHeightMm + GUTTER_MM),
    })
  }
  return out
}
