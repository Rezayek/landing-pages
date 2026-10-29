/**
 * HALO's product data, invented for a fictional design study: no real product, price or ship date. Every page that
 * shows a number from here says so next to it (`STUDY_NOTE`).
 */

export const STUDY_NOTE = 'HALO is a design study. Prices, dates and figures are illustrative.'

export type SizeId = '41' | '45'
export type FinishId = 'natural' | 'black'
export type BandId = 'signal' | 'graphite' | 'chalk' | 'glacier' | 'lane'

export interface Size {
  readonly id: SizeId
  readonly label: string
  readonly price: number
  /** Wrist circumference it fits, in mm. */
  readonly wrist: readonly [number, number]
}

export const SIZES: readonly Size[] = [
  { id: '41', label: '41 mm', price: 549, wrist: [130, 180] },
  { id: '45', label: '45 mm', price: 599, wrist: [150, 220] },
]

export interface Finish {
  readonly id: FinishId
  readonly label: string
  /** The drawing's case gradient, light to dark to light. Product colours: drawn on the product only, never UI. */
  readonly metal: readonly [string, string, string]
  readonly price: number
}

export const FINISHES: readonly Finish[] = [
  { id: 'natural', label: 'Natural titanium', metal: ['#e4e5e7', '#8a8d91', '#c9cbce'], price: 0 },
  { id: 'black', label: 'Black titanium', metal: ['#5a5c60', '#1f2023', '#46484c'], price: 50 },
]

export interface Band {
  readonly id: BandId
  readonly label: string
  /** The band's own colour: a product colour, shown on the product and its chip, never as a UI role. */
  readonly hex: string
  readonly soldOutIn?: SizeId
}

export const BANDS: readonly Band[] = [
  { id: 'signal', label: 'Signal orange', hex: '#ff5a1f' },
  { id: 'graphite', label: 'Graphite', hex: '#2b2c2f' },
  { id: 'chalk', label: 'Chalk', hex: '#e7e4dc' },
  { id: 'glacier', label: 'Glacier blue', hex: '#9db8d2', soldOutIn: '41' },
  { id: 'lane', label: 'Lane green', hex: '#5f7d5a' },
]

export interface Face {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly unit: string
  /** Share of the halo ring that is lit, 0-1. */
  readonly ring: number
}

/** The six faces the side dial steps through. */
export const FACES: readonly Face[] = [
  { id: 'time', label: 'Time', value: '7:42', unit: 'Tue 28', ring: 0.62 },
  { id: 'pace', label: 'Pace', value: '4:12', unit: '/km pace', ring: 0.7 },
  { id: 'heart', label: 'Heart rate', value: '168', unit: 'bpm · Z4', ring: 0.82 },
  { id: 'split', label: 'Split', value: '1:58', unit: 'lap 6', ring: 0.45 },
  { id: 'swim', label: 'Swim', value: '1:41', unit: '/100 m', ring: 0.55 },
  { id: 'battery', label: 'Battery', value: '14', unit: 'days left', ring: 0.9 },
]

export interface Zone {
  readonly id: 1 | 2 | 3 | 4 | 5
  readonly name: string
  readonly token: `--zone-${1 | 2 | 3 | 4 | 5}`
}

export const ZONES: readonly Zone[] = [
  { id: 1, name: 'Easy', token: '--zone-1' },
  { id: 2, name: 'Aerobic', token: '--zone-2' },
  { id: 3, name: 'Tempo', token: '--zone-3' },
  { id: 4, name: 'Threshold', token: '--zone-4' },
  { id: 5, name: 'Max', token: '--zone-5' },
]

export interface Build {
  readonly size: SizeId
  readonly finish: FinishId
  readonly band: BandId
}

export const DEFAULT_BUILD: Build = { size: '45', finish: 'natural', band: 'signal' }

export function priceOf(build: Build): number {
  const size = SIZES.find((s) => s.id === build.size) ?? SIZES[1]
  const finish = FINISHES.find((f) => f.id === build.finish) ?? FINISHES[0]
  return size.price + finish.price
}

export function describe(build: Build): string {
  const finish = FINISHES.find((f) => f.id === build.finish)?.label ?? ''
  const band = BANDS.find((b) => b.id === build.band)?.label ?? ''
  return `${build.size} mm · ${finish.replace(' titanium', '')} · ${band}`
}

export const euro = (value: number): string => `€${value.toLocaleString('en-IE')}`

/** A delivery range for a build, as the playground's stand-in for a stock service. */
export function deliveryOf(build: Build, today = new Date(2026, 10, 3)): string {
  const extra = build.band === 'glacier' ? 21 : build.finish === 'black' ? 10 : 7
  const from = new Date(today.getTime() + extra * 86_400_000)
  const to = new Date(from.getTime() + 7 * 86_400_000)
  const fmt = (d: Date): string => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `Delivery ${fmt(from)} to ${fmt(to)}`
}

export interface SpecGroup {
  readonly id: string
  readonly title: string
  readonly rows: readonly (readonly [string, string])[]
}

export const SPECS: readonly SpecGroup[] = [
  {
    id: 'case',
    title: 'Case',
    rows: [
      ['Material', 'Grade 5 titanium, bead-blasted flanks, brushed top'],
      ['Sizes', '41 × 41 × 11.4 mm · 45 × 45 × 11.9 mm'],
      ['Weight', '41 g · 47 g, without band'],
      ['Controls', 'Side dial with 24 detents, one button under the dial'],
    ],
  },
  {
    id: 'display',
    title: 'Display',
    rows: [
      ['Type', 'Square always-on display inside the halo ring'],
      ['Halo ring', "Today's training load against your goal"],
      ['Brightness', 'Up to 3000 nits outdoors'],
      ['Cover', 'Flat sapphire crystal'],
    ],
  },
  {
    id: 'sensors',
    title: 'Sensors',
    rows: [
      ['Position', 'Dual-band GNSS (L1 + L5)'],
      ['Heart', 'Optical heart rate, five-zone training'],
      ['Motion', 'Accelerometer, gyroscope, barometric altimeter, compass'],
    ],
  },
  {
    id: 'battery',
    title: 'Battery',
    rows: [
      ['Everyday', 'Up to 14 days'],
      ['GPS training', 'Up to 40 hours, dual-band'],
      ['Charge', '0 to 80% in 45 minutes'],
    ],
  },
  {
    id: 'water',
    title: 'Water',
    rows: [
      ['Rating', 'Water resistant to 100 m'],
      ['Swim', 'Pool and open-water tracking, lap and stroke'],
    ],
  },
  {
    id: 'band',
    title: 'Band',
    rows: [
      ['Material', 'Moulded silicone, 24 mm wide'],
      ['Fastening', 'Steel pin and keeper'],
      ['Colours', 'Signal orange, Graphite, Chalk, Glacier blue, Lane green'],
    ],
  },
]

export interface HeaderLink {
  readonly href: string
  readonly label: string
}

/** The header's section links. */
export const NAV_LINKS: readonly HeaderLink[] = [
  { href: '#design', label: 'Design' },
  { href: '#training', label: 'Training' },
  { href: '#battery', label: 'Battery' },
  { href: '#specs', label: 'Specs' },
]

