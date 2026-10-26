/**
 * Sample data for the VOLTCART landing page. VOLTCART is a design study: every game, price, date and timing here is
 * invented. Snapshot: Oct 23, 2026, 09:00 (BRIEF.md). Cover and pass art: generated for this study (DESIGN.md §Sources).
 */
import type { Platform } from '@/system/components'

export const SNAPSHOT = { date: 'Oct 23, 2026', time: '09:00', iso: '2026-10-23T09:00' } as const

/** Where a key activates. "global" works everywhere. */
export type KeyRegion = 'eu' | 'na' | 'global'
/** The visitor's choice in the region picker. */
export type VisitorRegion = 'all' | 'europe' | 'na' | 'rest'

export const REGION_OPTIONS: readonly { id: VisitorRegion; label: string }[] = [
  { id: 'all', label: 'All regions' },
  { id: 'europe', label: 'Europe (EU and UK)' },
  { id: 'na', label: 'North America' },
  { id: 'rest', label: 'Rest of the world' },
]

/** How a region reads inside a sentence ("won't activate in …"). */
export const REGION_IN_TEXT: Record<Exclude<VisitorRegion, 'all'>, string> = {
  europe: 'Europe',
  na: 'North America',
  rest: 'the rest of the world',
}

export function worksIn(key: KeyRegion, visitor: VisitorRegion): boolean {
  if (visitor === 'all' || key === 'global') return true
  return (key === 'eu' && visitor === 'europe') || (key === 'na' && visitor === 'na')
}

export const REGION_LINE: Record<KeyRegion, string> = {
  eu: 'Works in Europe',
  na: 'North America only',
  global: 'Works everywhere',
}

export type PlatformFilter = 'all' | Platform

export const PLATFORM_OPTIONS: readonly { id: PlatformFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'PC', label: 'PC' },
  { id: 'PS5', label: 'PlayStation' },
  { id: 'XBOX', label: 'Xbox' },
  { id: 'SWITCH', label: 'Switch' },
]

export const PLATFORM_NAME: Record<Platform, string> = { PC: 'PC', PS5: 'PlayStation', XBOX: 'Xbox', SWITCH: 'Switch' }

export interface Deal {
  id: string
  kind: 'game' | 'pass'
  title: string
  platform: Platform
  region: KeyRegion
  price: number
  list: number
  /** One HUD line of real data: "Lowest in 90 days", "Price dropped today", "Code in about 1 min". */
  meta: string
  cover: string
  /** The kiosk number on the street (Kiosk 01 is the hero). */
  kiosk: number
}

const img = (name: string) => `/voltcart-landing/img/${name}.webp`

export const DEALS: readonly Deal[] = [
  { id: 'neon-drift', kind: 'game', title: 'Neon Drift', platform: 'PC', region: 'eu', price: 16.8, list: 59.99, meta: 'Lowest in 90 days', cover: img('cover-neon-drift'), kiosk: 1 },
  { id: 'static-bloom', kind: 'game', title: 'Static Bloom', platform: 'PC', region: 'global', price: 8.49, list: 29.99, meta: 'Price dropped today', cover: img('cover-static-bloom'), kiosk: 2 },
  { id: 'chrome-saints', kind: 'game', title: 'Chrome Saints', platform: 'XBOX', region: 'na', price: 32.49, list: 69.99, meta: 'Lowest in 30 days', cover: img('cover-chrome-saints'), kiosk: 3 },
  { id: 'rustline', kind: 'game', title: 'Rustline Couriers', platform: 'PS5', region: 'global', price: 21.6, list: 49.99, meta: 'Code in about 1 min', cover: img('cover-rustline'), kiosk: 4 },
  { id: 'nightshift', kind: 'game', title: 'Nightshift Protocol', platform: 'PC', region: 'global', price: 12.99, list: 34.99, meta: 'Price dropped today', cover: img('cover-nightshift'), kiosk: 5 },
  { id: 'saltglass', kind: 'game', title: 'Saltglass', platform: 'PS5', region: 'eu', price: 27.99, list: 59.99, meta: 'Lowest in 60 days', cover: img('cover-saltglass'), kiosk: 6 },
  { id: 'hexfall', kind: 'game', title: 'Hexfall', platform: 'SWITCH', region: 'eu', price: 19.99, list: 39.99, meta: 'Code in about 1 min', cover: img('cover-hexfall'), kiosk: 7 },
  { id: 'low-orbit', kind: 'game', title: 'Low Orbit Kitchen', platform: 'SWITCH', region: 'na', price: 11.99, list: 24.99, meta: 'Lowest in 90 days', cover: img('cover-low-orbit'), kiosk: 8 },
]

export const LEAD = DEALS[0]

/** Neon Drift's price, one point a day for 90 days, ending today (sample). The list price was last seen Jul 26. */
export const LEAD_HISTORY: readonly number[] = (() => {
  const steps: [number, number][] = [
    [8, 59.99], [14, 54.99], [10, 59.99], [9, 49.99], [12, 44.1], [10, 39.99], [8, 29.99], [7, 24.99], [11, 21.99], [1, 16.8],
  ]
  return steps.flatMap(([days, price]) => Array.from({ length: days }, () => price))
})()

export interface Pass {
  id: string
  game: string
  season: string
  edition: string
  platforms: string
  region: KeyRegion
  price: number
  list: number
  seasonEnds: string
  saleEnds: string
  /** Premium tiers the code opens at once. */
  tiersAtOnce: number
  rewards: Readonly<Record<number, string>>
  art: string
}

export const PASSES: readonly Pass[] = [
  { id: 'gridrunner-s4', game: 'Gridrunner', season: 'Season 4', edition: 'Premium+', platforms: 'PC, PlayStation, Xbox', region: 'global', price: 9.6, list: 16, seasonEnds: 'Dec 10, 2026', saleEnds: 'Thu Oct 29', tiersAtOnce: 25, rewards: { 10: 'Trail', 30: 'Board', 50: 'Suit', 100: 'Crown' }, art: img('pass-gridrunner') },
  { id: 'chrome-saints-pass', game: 'Chrome Saints', season: 'Season pass 2', edition: 'Premium', platforms: 'Xbox, PC', region: 'na', price: 14.99, list: 24.99, seasonEnds: 'Jan 15, 2027', saleEnds: 'Thu Oct 29', tiersAtOnce: 10, rewards: { 20: 'Helm', 50: 'Halo', 100: 'Relic' }, art: img('pass-chrome-saints') },
  { id: 'rustline-route', game: 'Rustline Couriers', season: 'Route Pass S2', edition: 'Premium', platforms: 'PlayStation, PC', region: 'global', price: 6.49, list: 9.99, seasonEnds: 'Nov 30, 2026', saleEnds: 'Thu Oct 29', tiersAtOnce: 0, rewards: { 10: 'Crate', 40: 'Rig', 100: 'Hauler' }, art: img('pass-rustline') },
  { id: 'neon-drift-league', game: 'Neon Drift', season: 'Night League', edition: 'Premium', platforms: 'PC', region: 'eu', price: 7.99, list: 12.99, seasonEnds: 'Dec 31, 2026', saleEnds: 'Thu Oct 29', tiersAtOnce: 5, rewards: { 10: 'Decal', 60: 'Wheel', 100: 'Trophy' }, art: img('pass-neon-drift') },
]

/** The sample order in S4, played 10× faster. Times are the order's clock (s); `at` is the playback time (ms). */
export const DELIVERY_STEPS: readonly { clock: string; label: string; at: number }[] = [
  { clock: '0:00', label: 'Paid', at: 0 },
  { clock: '0:12', label: 'Payment cleared', at: 1200 },
  { clock: '0:48', label: 'Code issued', at: 4800 },
  { clock: '0:58', label: 'Code ready, on screen and emailed', at: 5800 },
]
export const DELIVERY_RUN_MS = 6200
export const SAMPLE_CODE = 'NDX4K-7Q2M9-RT8WB-4HXPL-9CZ3V'
export const SAMPLE_ORDER = 'VC-48213'

export const money = (n: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
export const percentOff = (price: number, list: number): number => Math.round((1 - price / list) * 100)
export const MAX_OFF = Math.max(...DEALS.map((d) => percentOff(d.price, d.list)))
