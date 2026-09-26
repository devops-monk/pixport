import type { DocType, PhotoSpec, Range } from '../types'

/**
 * Photo requirements, compiled from government guidance and ICAO 9303.
 * Rules change — the UI always asks people to double-check with the issuing office.
 */

const WHITE = { background: '#ffffff', backgroundName: 'White' }
const LIGHT_GREY = { background: '#eeeeee', backgroundName: 'Light grey' }

const ICAO_NOTES = [
  'Neutral expression, mouth closed',
  'Eyes open and looking at the camera',
  'No glasses, hats or head coverings (religious exceptions allowed)',
  'Even lighting with no shadows on the face or background',
]

interface Base {
  country: string
  iso2?: string
  doc: DocType
  title: string
  background: string
  backgroundName: string
  maxKb?: number
  notes?: string[]
}

function spec(
  id: string,
  base: Base,
  size: [widthMm: number, heightMm: number],
  head: Range,
  extra: { eyeFromBottom?: Range; topMargin?: Range } = {},
): PhotoSpec {
  return {
    id,
    ...base,
    widthMm: size[0],
    heightMm: size[1],
    dpi: 300,
    head,
    ...extra,
    notes: base.notes ?? ICAO_NOTES,
  }
}

const US_2X2: [number, number] = [50.8, 50.8] // exactly 2 in → 600 px at 300 dpi
const US_HEAD: Range = [25, 35]
const US_EYES = { eyeFromBottom: [28, 35] as Range }
const ICAO: [number, number] = [35, 45]
const ICAO_HEAD: Range = [32, 36]

export const SPECS: PhotoSpec[] = [
  // North America
  spec('us-passport', { country: 'United States', iso2: 'US', doc: 'passport', title: 'Passport', ...WHITE,
    notes: ['No glasses', 'Taken in the last 6 months', ...ICAO_NOTES.slice(0, 2)] }, US_2X2, US_HEAD, US_EYES),
  spec('us-visa', { country: 'United States', iso2: 'US', doc: 'visa', title: 'Visa & DV Lottery', ...WHITE, maxKb: 240,
    notes: ['JPEG, 600×600 to 1200×1200 px, 240 KB or less', 'No glasses', ...ICAO_NOTES.slice(0, 2)] }, US_2X2, US_HEAD, US_EYES),
  spec('us-greencard', { country: 'United States', iso2: 'US', doc: 'id', title: 'Green card & citizenship', ...WHITE }, US_2X2, US_HEAD, US_EYES),
  spec('ca-passport', { country: 'Canada', iso2: 'CA', doc: 'passport', title: 'Passport', ...WHITE,
    notes: ['Photo 50 × 70 mm', 'Plain white or light-coloured background', ...ICAO_NOTES] }, [50, 70], [31, 36]),
  spec('ca-visa', { country: 'Canada', iso2: 'CA', doc: 'visa', title: 'Visa & PR card', ...WHITE }, ICAO, [31, 36]),
  spec('mx-passport', { country: 'Mexico', iso2: 'MX', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, ICAO_HEAD),

  // Europe
  spec('uk-passport', { country: 'United Kingdom', iso2: 'GB', doc: 'passport', title: 'Passport', background: '#ececec', backgroundName: 'Light grey',
    notes: ['Plain cream or light grey background', ...ICAO_NOTES] }, ICAO, [29, 34]),
  spec('uk-visa', { country: 'United Kingdom', iso2: 'GB', doc: 'visa', title: 'Visa', background: '#ececec', backgroundName: 'Light grey' }, ICAO, [29, 34]),
  spec('ie-passport', { country: 'Ireland', iso2: 'IE', doc: 'passport', title: 'Passport', ...LIGHT_GREY }, ICAO, ICAO_HEAD),
  spec('schengen-visa', { country: 'Schengen area', iso2: 'EU', doc: 'visa', title: 'Schengen visa', ...LIGHT_GREY }, ICAO, ICAO_HEAD, { topMargin: [2, 6] }),
  spec('de-passport', { country: 'Germany', iso2: 'DE', doc: 'passport', title: 'Passport & ID card', background: '#e6e6e6', backgroundName: 'Light grey',
    notes: ['Neutral light grey background works best', ...ICAO_NOTES] }, ICAO, ICAO_HEAD, { topMargin: [2, 6] }),
  spec('fr-passport', { country: 'France', iso2: 'FR', doc: 'passport', title: 'Passport & ID card', background: '#e1e4e8', backgroundName: 'Light grey-blue',
    notes: ['Plain light background — pure white is not accepted', ...ICAO_NOTES] }, ICAO, ICAO_HEAD),
  spec('it-passport', { country: 'Italy', iso2: 'IT', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, ICAO_HEAD),
  spec('nl-passport', { country: 'Netherlands', iso2: 'NL', doc: 'passport', title: 'Passport & ID card', ...LIGHT_GREY }, ICAO, ICAO_HEAD),
  spec('pl-passport', { country: 'Poland', iso2: 'PL', doc: 'passport', title: 'Passport & ID card', ...WHITE }, ICAO, ICAO_HEAD),
  spec('ru-visa', { country: 'Russia', iso2: 'RU', doc: 'visa', title: 'Visa', ...WHITE }, ICAO, ICAO_HEAD),
  spec('tr-passport', { country: 'Türkiye', iso2: 'TR', doc: 'passport', title: 'Biometric passport', ...WHITE }, [50, 60], ICAO_HEAD),

  // Asia
  spec('in-passport', { country: 'India', iso2: 'IN', doc: 'passport', title: 'Passport', ...WHITE,
    notes: ['Plain white background', 'Face should cover about 80% of the photo', ...ICAO_NOTES] }, ICAO, [31, 36]),
  spec('in-visa', { country: 'India', iso2: 'IN', doc: 'visa', title: 'Visa & e-Visa', ...WHITE, maxKb: 1000 }, US_2X2, US_HEAD, US_EYES),
  spec('in-oci', { country: 'India', iso2: 'IN', doc: 'id', title: 'OCI card', ...WHITE }, US_2X2, US_HEAD, US_EYES),
  spec('in-pan', { country: 'India', iso2: 'IN', doc: 'id', title: 'PAN card', ...WHITE }, [25, 35], [19, 24]),
  spec('cn-visa', { country: 'China', iso2: 'CN', doc: 'visa', title: 'Visa', ...WHITE, maxKb: 120,
    notes: ['Online upload: 354–420 × 472–560 px, 40–120 KB', ...ICAO_NOTES] }, [33, 48], [28, 33], { topMargin: [3, 5] }),
  spec('cn-passport', { country: 'China', iso2: 'CN', doc: 'passport', title: 'Passport & travel permit', ...WHITE }, [33, 48], [28, 33], { topMargin: [3, 5] }),
  spec('jp-passport', { country: 'Japan', iso2: 'JP', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, ICAO_HEAD, { topMargin: [2, 6] }),
  spec('kr-passport', { country: 'South Korea', iso2: 'KR', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, ICAO_HEAD),
  spec('sg-passport', { country: 'Singapore', iso2: 'SG', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, [25, 35]),
  spec('my-passport', { country: 'Malaysia', iso2: 'MY', doc: 'passport', title: 'Passport', ...WHITE }, [35, 50], ICAO_HEAD),
  spec('th-visa', { country: 'Thailand', iso2: 'TH', doc: 'visa', title: 'Visa & e-Visa', ...WHITE }, ICAO, ICAO_HEAD),
  spec('vn-visa', { country: 'Vietnam', iso2: 'VN', doc: 'visa', title: 'Visa & passport', ...WHITE }, [40, 60], [30, 36]),
  spec('ph-passport', { country: 'Philippines', iso2: 'PH', doc: 'passport', title: 'Passport & visa', ...WHITE }, ICAO, ICAO_HEAD),
  spec('id-visa', { country: 'Indonesia', iso2: 'ID', doc: 'visa', title: 'Visa', ...WHITE }, ICAO, ICAO_HEAD),
  spec('pk-passport', { country: 'Pakistan', iso2: 'PK', doc: 'passport', title: 'Passport & visa', ...WHITE }, ICAO, ICAO_HEAD),
  spec('bd-passport', { country: 'Bangladesh', iso2: 'BD', doc: 'passport', title: 'Passport', ...WHITE }, [45, 55], [32, 40]),
  spec('np-passport', { country: 'Nepal', iso2: 'NP', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, ICAO_HEAD),
  spec('ae-visa', { country: 'United Arab Emirates', iso2: 'AE', doc: 'visa', title: 'Visa & Emirates ID', ...WHITE }, [43, 55], [32, 40]),
  spec('sa-visa', { country: 'Saudi Arabia', iso2: 'SA', doc: 'visa', title: 'Visa', ...WHITE }, US_2X2, US_HEAD, US_EYES),

  // Oceania
  spec('au-passport', { country: 'Australia', iso2: 'AU', doc: 'passport', title: 'Passport', ...WHITE,
    notes: ['Plain white or light grey background', ...ICAO_NOTES] }, ICAO, ICAO_HEAD),
  spec('nz-passport', { country: 'New Zealand', iso2: 'NZ', doc: 'passport', title: 'Passport', ...LIGHT_GREY }, ICAO, ICAO_HEAD),

  // Africa & South America
  spec('ng-passport', { country: 'Nigeria', iso2: 'NG', doc: 'passport', title: 'Passport', ...WHITE }, ICAO, ICAO_HEAD),
  spec('za-passport', { country: 'South Africa', iso2: 'ZA', doc: 'passport', title: 'Passport & visa', ...WHITE }, ICAO, ICAO_HEAD),
  spec('br-visa', { country: 'Brazil', iso2: 'BR', doc: 'visa', title: 'Visa', ...WHITE }, [50, 70], [34, 44]),

  // Generic sizes
  spec('generic-35x45', { country: '35 × 45 mm', doc: 'generic', title: 'Standard ICAO size', ...WHITE }, ICAO, ICAO_HEAD),
  spec('generic-2x2', { country: '2 × 2 in', doc: 'generic', title: '51 × 51 mm', ...WHITE }, US_2X2, US_HEAD, US_EYES),
  spec('generic-30x40', { country: '30 × 40 mm', doc: 'generic', title: 'Small ID size', ...WHITE }, [30, 40], [26, 30]),
  spec('generic-40x60', { country: '40 × 60 mm', doc: 'generic', title: '4 × 6 cm', ...WHITE }, [40, 60], [30, 36]),
]

export const DEFAULT_SPEC_ID = 'generic-35x45'

export function getSpec(id: string): PhotoSpec | undefined {
  return SPECS.find((s) => s.id === id)
}

export function customSpec(widthMm: number, heightMm: number, background = '#ffffff'): PhotoSpec {
  // Scale the ICAO head proportion (32–36 mm of 45 mm) to the custom height.
  const ratio = heightMm / 45
  return {
    id: `custom-${widthMm}x${heightMm}`,
    country: 'Custom size',
    doc: 'generic',
    title: `${widthMm} × ${heightMm} mm`,
    widthMm,
    heightMm,
    dpi: 300,
    head: [round1(32 * ratio), round1(36 * ratio)],
    background,
    backgroundName: 'Custom',
    notes: ICAO_NOTES,
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function flagEmoji(iso2?: string): string {
  if (!iso2) return ''
  return String.fromCodePoint(...[...iso2.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export function specPixels(spec: PhotoSpec): { width: number; height: number } {
  return {
    width: Math.round((spec.widthMm / 25.4) * spec.dpi),
    height: Math.round((spec.heightMm / 25.4) * spec.dpi),
  }
}

export const DOC_LABELS: Record<DocType, string> = {
  passport: 'Passport',
  visa: 'Visa',
  id: 'ID card',
  generic: 'Standard size',
}

/** Guess a sensible default from the browser locale, e.g. en-IN → India passport. */
export function suggestedSpecId(): string {
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase()
  const match = SPECS.find((s) => s.iso2 === region && s.doc === 'passport')
  return match?.id ?? DEFAULT_SPEC_ID
}
