import type { FaceGeometry, PhotoSpec, Range } from '../../types'
import type { Measurements } from './autoCrop'

export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface Check {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

const fmt = (n: number) => `${n.toFixed(1)} mm`
const fmtRange = (r: Range) => `${r[0]}–${r[1]} mm`

function rangeStatus(value: number, range: Range, slack: number): CheckStatus {
  if (value >= range[0] - 0.3 && value <= range[1] + 0.3) return 'pass'
  if (value >= range[0] - slack && value <= range[1] + slack) return 'warn'
  return 'fail'
}

export interface ComplianceInput {
  spec: PhotoSpec
  face: FaceGeometry | null
  m: Measurements | null
  /** Residual head tilt after straightening, in degrees. */
  rollDeg: number
  backgroundReplaced: boolean
}

export function runChecks({ spec, face, m, rollDeg, backgroundReplaced }: ComplianceInput): Check[] {
  if (!face || !m) {
    return [
      {
        id: 'face',
        label: 'Face found',
        status: 'fail',
        detail: 'No face was found. Use a well-lit, front-facing photo, or position the crop by hand.',
      },
    ]
  }

  const checks: Check[] = []

  checks.push(
    face.faceCount > 1
      ? { id: 'face', label: 'One person only', status: 'warn', detail: `${face.faceCount} faces found — only one person may be in the photo.` }
      : { id: 'face', label: 'Face found', status: 'pass', detail: 'One face, clearly visible.' },
  )

  checks.push({
    id: 'head',
    label: 'Head size',
    status: rangeStatus(m.headMm, spec.head, 2),
    detail: `${fmt(m.headMm)} chin to crown · needs ${fmtRange(spec.head)}`,
  })

  if (spec.eyeFromBottom) {
    checks.push({
      id: 'eyes-height',
      label: 'Eye height',
      status: rangeStatus(m.eyeFromBottomMm, spec.eyeFromBottom, 2),
      detail: `${fmt(m.eyeFromBottomMm)} from bottom · needs ${fmtRange(spec.eyeFromBottom)}`,
    })
  }

  if (spec.topMargin) {
    checks.push({
      id: 'top',
      label: 'Space above head',
      status: rangeStatus(m.topMarginMm, spec.topMargin, 1.5),
      detail: `${fmt(m.topMarginMm)} · needs ${fmtRange(spec.topMargin)}`,
    })
  } else {
    checks.push({
      id: 'top',
      label: 'Whole head in frame',
      status: m.topMarginMm >= 0.5 ? 'pass' : m.topMarginMm >= -1 ? 'warn' : 'fail',
      detail: m.topMarginMm >= 0.5 ? 'Top of the head is inside the photo.' : 'The top of the head is cut off. Zoom out a little.',
    })
  }

  const off = Math.abs(m.centerOffsetMm)
  checks.push({
    id: 'center',
    label: 'Centred',
    status: off < 1 ? 'pass' : off < 2.5 ? 'warn' : 'fail',
    detail: off < 1 ? 'Face is centred left to right.' : `Face is ${off.toFixed(1)} mm off centre.`,
  })

  const tilt = Math.abs(rollDeg)
  checks.push({
    id: 'tilt',
    label: 'Head level',
    status: tilt < 3 ? 'pass' : tilt < 6 ? 'warn' : 'fail',
    detail: tilt < 3 ? 'Head is level.' : `Head is tilted ${tilt.toFixed(0)}°. Use Straighten to level it.`,
  })

  checks.push({
    id: 'yaw',
    label: 'Facing the camera',
    status: Math.abs(face.yaw) < 0.15 ? 'pass' : Math.abs(face.yaw) < 0.3 ? 'warn' : 'fail',
    detail: Math.abs(face.yaw) < 0.15 ? 'Looking straight ahead.' : 'Face is turned to one side. Retake facing the camera.',
  })

  checks.push({
    id: 'eyes-open',
    label: 'Eyes open',
    status: face.eyesOpen > 0.55 ? 'pass' : 'warn',
    detail: face.eyesOpen > 0.55 ? 'Both eyes are open.' : 'Eyes look closed or half-closed.',
  })

  const neutral = face.neutral > 0.6 && face.mouthClosed > 0.75
  checks.push({
    id: 'expression',
    label: 'Neutral expression',
    status: neutral ? 'pass' : 'warn',
    detail: neutral
      ? 'Relaxed face, mouth closed.'
      : face.mouthClosed <= 0.75
        ? 'Mouth looks open. Close your mouth and relax your face.'
        : 'Looks like a smile. Most countries require a neutral expression with the mouth closed.',
  })

  checks.push({
    id: 'background',
    label: 'Plain background',
    status: backgroundReplaced ? 'pass' : 'warn',
    detail: backgroundReplaced
      ? `Background set to ${spec.backgroundName.toLowerCase()}.`
      : 'Background is from the original photo. Replace it for an even, plain backdrop.',
  })

  checks.push({
    id: 'resolution',
    label: 'Sharp enough',
    status: m.upscale <= 1.3 ? 'pass' : m.upscale <= 2.2 ? 'warn' : 'fail',
    detail:
      m.upscale <= 1.3
        ? 'Plenty of detail for print.'
        : 'The face is small in the original photo, so it will be enlarged. Move closer or use a higher-resolution photo.',
  })

  return checks
}

export function summarize(checks: Check[]): { status: CheckStatus; passed: number; total: number } {
  const passed = checks.filter((c) => c.status === 'pass').length
  const status: CheckStatus = checks.some((c) => c.status === 'fail')
    ? 'fail'
    : checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'pass'
  return { status, passed, total: checks.length }
}
