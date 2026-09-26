import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { FaceGeometry, Point } from '../../types'
import { rotatePoint } from '../image/canvas'

const VERSION = '1.0.1'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

// Face mesh landmark indices.
const IRIS_A = 468
const IRIS_B = 473
const FOREHEAD = 10
const CHIN = 152
const CHEEK_A = 234
const CHEEK_B = 454
const NOSE_TIP = 1

/** Chin→crown is roughly this multiple of chin→upper-forehead (landmark 10). */
const CROWN_FACTOR = 1.26

let landmarker: Promise<FaceLandmarker> | null = null

async function create(delegate: 'GPU' | 'CPU'): Promise<FaceLandmarker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'IMAGE',
    numFaces: 3,
    outputFaceBlendshapes: true,
  })
}

function getLandmarker(): Promise<FaceLandmarker> {
  landmarker ??= create('GPU').catch(() => create('CPU'))
  landmarker.catch(() => {
    landmarker = null
  })
  return landmarker
}

export function preloadFaceModel(): void {
  getLandmarker().catch(() => {})
}

/** Raw face measurements in the coordinates of the analysed image. */
export interface FaceScan {
  points: { eyeA: Point; eyeB: Point; chin: Point; forehead: Point; cheekA: Point; cheekB: Point; nose: Point }
  eyesOpen: number
  mouthClosed: number
  neutral: number
  faceCount: number
}

export async function scanFace(image: HTMLCanvasElement): Promise<FaceScan | null> {
  const lm = await getLandmarker()
  const result = lm.detect(image)
  if (!result.faceLandmarks.length) return null

  // The largest face is the subject.
  const spans = result.faceLandmarks.map((f) => Math.abs(f[CHIN].y - f[FOREHEAD].y))
  const idx = spans.indexOf(Math.max(...spans))
  const face = result.faceLandmarks[idx]
  const px = (l: NormalizedLandmark): Point => ({ x: l.x * image.width, y: l.y * image.height })

  const shapes = new Map(result.faceBlendshapes[idx]?.categories.map((c) => [c.categoryName, c.score]) ?? [])
  const blink = Math.max(shapes.get('eyeBlinkLeft') ?? 0, shapes.get('eyeBlinkRight') ?? 0)

  return {
    points: {
      eyeA: px(face[IRIS_A]),
      eyeB: px(face[IRIS_B]),
      chin: px(face[CHIN]),
      forehead: px(face[FOREHEAD]),
      cheekA: px(face[CHEEK_A]),
      cheekB: px(face[CHEEK_B]),
      nose: px(face[NOSE_TIP]),
    },
    eyesOpen: 1 - blink,
    mouthClosed: 1 - (shapes.get('jawOpen') ?? 0),
    neutral:
      1 -
      Math.max(
        shapes.get('jawOpen') ?? 0,
        ((shapes.get('mouthSmileLeft') ?? 0) + (shapes.get('mouthSmileRight') ?? 0)) / 2,
      ),
    faceCount: result.faceLandmarks.length,
  }
}

/** Tilt of the line between the eyes, in degrees. */
export function rollOf(scan: FaceScan): number {
  const [l, r] = scan.points.eyeA.x < scan.points.eyeB.x
    ? [scan.points.eyeA, scan.points.eyeB]
    : [scan.points.eyeB, scan.points.eyeA]
  return (Math.atan2(r.y - l.y, r.x - l.x) * 180) / Math.PI
}

/**
 * Turn a scan into face geometry for an image that was rotated by `rotateDeg`
 * (see `rotateCanvas`). `mask`, if given, is the background-removed cut-out in the
 * same rotated space and is used to find the real top of the hair.
 */
export function geometryFor(
  scan: FaceScan,
  srcW: number,
  srcH: number,
  rotateDeg: number,
  mask?: HTMLCanvasElement | null,
): FaceGeometry {
  const t = (p: Point) => rotatePoint(p, srcW, srcH, rotateDeg)
  const p = scan.points
  const eyeA = t(p.eyeA)
  const eyeB = t(p.eyeB)
  const [leftEye, rightEye] = eyeA.x < eyeB.x ? [eyeA, eyeB] : [eyeB, eyeA]
  const chin = t(p.chin)
  const forehead = t(p.forehead)
  const cheekA = t(p.cheekA)
  const cheekB = t(p.cheekB)
  const nose = t(p.nose)

  const eye = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }
  const faceWidth = Math.hypot(cheekB.x - cheekA.x, cheekB.y - cheekA.y)
  const centerX = (cheekA.x + cheekB.x) / 2
  const faceSpan = chin.y - forehead.y

  let crownY = chin.y - faceSpan * CROWN_FACTOR
  if (mask) {
    const hairTop = findMaskTop(mask, centerX, faceWidth * 0.18, forehead.y)
    if (hairTop !== null) {
      // Keep big hairstyles from shrinking the face too much.
      const lo = chin.y - faceSpan * 1.42
      const hi = chin.y - faceSpan * 1.12
      crownY = Math.min(hi, Math.max(lo, hairTop))
    }
  }

  const roll = (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI
  const yaw = faceWidth ? (nose.x - centerX) / (faceWidth / 2) : 0

  return {
    eye,
    leftEye,
    rightEye,
    chin,
    crown: { x: centerX, y: crownY },
    centerX,
    faceWidth,
    rollDeg: roll,
    yaw,
    eyesOpen: scan.eyesOpen,
    mouthClosed: scan.mouthClosed,
    neutral: scan.neutral,
    faceCount: scan.faceCount,
  }
}

/** Topmost opaque row in a narrow band above the forehead. */
function findMaskTop(mask: HTMLCanvasElement, cx: number, halfBand: number, startY: number): number | null {
  const x0 = Math.max(0, Math.round(cx - halfBand))
  const x1 = Math.min(mask.width, Math.round(cx + halfBand))
  const y1 = Math.min(mask.height, Math.max(1, Math.round(startY)))
  if (x1 <= x0 || y1 <= 1) return null
  const data = mask.getContext('2d', { willReadFrequently: true })!.getImageData(x0, 0, x1 - x0, y1).data
  const w = x1 - x0
  // Walk down from the top; the first row where most of the band is opaque is the hair line.
  for (let y = 0; y < y1; y++) {
    let solid = 0
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 128) solid++
    if (solid > w * 0.5) return y
  }
  return null
}
