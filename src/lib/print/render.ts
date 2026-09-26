import { canvasToBlob, createCanvas, ctx2d } from '../image/canvas'
import { withJpegDpi } from '../image/export'
import { cellPositions, type Paper, type SheetLayout } from './layout'

/** Draw every photo onto a white sheet with light cut guides. */
export function renderSheet(photo: HTMLCanvasElement, paper: Paper, layout: SheetLayout, dpi: number): HTMLCanvasElement {
  const pxPerMm = dpi / 25.4
  const sheet = createCanvas(paper.widthMm * pxPerMm, paper.heightMm * pxPerMm)
  const ctx = ctx2d(sheet)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, sheet.width, sheet.height)

  const cw = layout.cellWidthMm * pxPerMm
  const ch = layout.cellHeightMm * pxPerMm
  const cells = cellPositions(layout)

  for (const cell of cells) {
    const x = cell.x * pxPerMm
    const y = cell.y * pxPerMm
    ctx.save()
    if (layout.rotated) {
      ctx.translate(x + cw / 2, y + ch / 2)
      ctx.rotate(Math.PI / 2)
      ctx.drawImage(photo, -ch / 2, -cw / 2, ch, cw)
    } else {
      ctx.drawImage(photo, x, y, cw, ch)
    }
    ctx.restore()
  }

  // Thin outlines make cutting with scissors or a trimmer easy.
  ctx.strokeStyle = '#c7c7cc'
  ctx.lineWidth = Math.max(1, pxPerMm * 0.1)
  for (const cell of cells) {
    ctx.strokeRect(cell.x * pxPerMm, cell.y * pxPerMm, cw, ch)
  }
  return sheet
}

export async function sheetToJpeg(sheet: HTMLCanvasElement, dpi: number): Promise<Blob> {
  return withJpegDpi(await canvasToBlob(sheet, 'image/jpeg', 0.95), dpi)
}

export async function sheetToPdf(sheet: HTMLCanvasElement, paper: Paper): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    unit: 'mm',
    format: [paper.widthMm, paper.heightMm],
    orientation: paper.widthMm > paper.heightMm ? 'landscape' : 'portrait',
  })
  const data = sheet.toDataURL('image/jpeg', 0.95)
  pdf.addImage(data, 'JPEG', 0, 0, paper.widthMm, paper.heightMm, undefined, 'NONE')
  return pdf.output('blob')
}
