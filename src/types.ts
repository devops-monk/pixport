export type Range = readonly [min: number, max: number]

export type DocType = 'passport' | 'visa' | 'id' | 'generic'

export interface PhotoSpec {
  id: string
  /** Display name of the issuing country or region. */
  country: string
  /** ISO 3166-1 alpha-2, used for the flag. Omitted for generic sizes. */
  iso2?: string
  doc: DocType
  title: string
  widthMm: number
  heightMm: number
  dpi: number
  /** Chin to crown (top of head), in mm. */
  head: Range
  /** Distance from the bottom edge of the photo to the eye line, in mm. */
  eyeFromBottom?: Range
  /** Distance from the top edge of the photo to the crown, in mm. */
  topMargin?: Range
  background: string
  backgroundName: string
  /** Upper file size limit for online uploads. */
  maxKb?: number
  notes: string[]
}

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Face geometry in pixel coordinates of the image it was measured on. */
export interface FaceGeometry {
  /** Midpoint between the pupils. */
  eye: Point
  leftEye: Point
  rightEye: Point
  chin: Point
  /** Estimated top of the head. */
  crown: Point
  /** Horizontal centre of the face. */
  centerX: number
  faceWidth: number
  /** Head roll in degrees; positive means the head tilts clockwise. */
  rollDeg: number
  /** Rough left/right turn, -1..1 (0 = facing camera). */
  yaw: number
  eyesOpen: number
  mouthClosed: number
  /** 1 = relaxed face; drops with smiling or an open mouth. */
  neutral: number
  faceCount: number
}

export interface Adjustments {
  exposure: number
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  tint: number
  sharpness: number
  vignette: number
}

export type BackgroundKind = 'original' | 'transparent' | 'color' | 'gradient' | 'blur' | 'image'

export interface BackgroundSettings {
  kind: BackgroundKind
  color: string
  color2: string
  angle: number
  blur: number
}

export interface Transform {
  rotate: 0 | 90 | 180 | 270
  flipH: boolean
  flipV: boolean
}
