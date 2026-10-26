/**
 * The landing page's sample data (captured 2026-10-24 from `src/system/components/sample.ts`): real game names, numbers
 * for illustration, labelled "Sample build" / "Sample banner dates" on the page (BRIEF.md, DESIGN.md §Sources).
 */
import { byId, JINHSI_BUILD, type EchoSlotData, type Resonator, type SampleEcho } from '@/system/components'

export const CAPTURED = '2026-10-24'

/** Where the primary action and the other app links go until the app pages exist (UX.md §CTA path). */
export const LINKS = {
  database: '/system#scenario-resonator-search',
  planner: '/system#scenario-echo-planner',
  team: '/system#component-team-builder',
  build: (id: string): string => `/system#scenario-resonator-build?resonator=${id}`,
  credits: '/resonators/full/CREDITS.md',
} as const


/*
 * The shared build (agreed round 1, A1-A3): one Jinhsi build that the hero's sockets, the S2 build panel and the S3
 * planner all read and write. A slot is an Echo from the pool plus the main stat it carries; the main-stat options per
 * cost are the game's (sample values).
 */
export type MainId = 'cd' | 'cr' | 'atk' | 'spectro' | 'er' | 'hp' | 'def'
export interface MainOption {
  readonly id: MainId
  readonly stat: string
  readonly value: string
}
export const MAINS: Readonly<Record<SampleEcho['cost'], readonly MainOption[]>> = {
  4: [
    { id: 'cd', stat: 'Crit DMG', value: '44.0%' },
    { id: 'cr', stat: 'Crit Rate', value: '22.0%' },
    { id: 'atk', stat: 'ATK', value: '33.0%' },
  ],
  3: [
    { id: 'spectro', stat: 'Spectro DMG Bonus', value: '30.0%' },
    { id: 'atk', stat: 'ATK', value: '30.0%' },
    { id: 'er', stat: 'Energy Regen', value: '32.0%' },
  ],
  1: [
    { id: 'atk', stat: 'ATK', value: '18.0%' },
    { id: 'hp', stat: 'HP', value: '22.8%' },
    { id: 'def', stat: 'DEF', value: '18.0%' },
  ],
}

const [aix, hoochief, junrock3, hoartoise, junrock1] = JINHSI_BUILD.echoes
/** Every Echo the page can socket, by a short key used in build links. Echoes with no local icon show our fallback. */
export const ECHO_POOL: Readonly<Record<string, SampleEcho>> = {
  aix,
  hoochief,
  junrock3,
  hoartoise,
  junrock1,
  crownless: { name: 'Crownless', cost: 4, level: 25, set: 'Havoc Eclipse', main: ['Crit Rate', '22.0%'], fixed: ['ATK', '150'], subs: [['Crit DMG', '12.6%']], icon: null },
  heron: { name: 'Violet-Feathered Heron', cost: 3, level: 25, set: 'Celestial Light', main: ['ATK', '30.0%'], fixed: ['ATK', '100'], subs: [['Crit Rate', '6.3%']], icon: null },
  hooscamp: { name: 'Hooscamp', cost: 1, level: 25, set: 'Celestial Light', main: ['ATK', '18.0%'], fixed: ['HP', '2,280'], subs: [['Crit Rate', '6.3%']], icon: null },
}

export interface BuildSlot {
  readonly key: string
  readonly main: MainId
}
export const HER_SLOTS: readonly BuildSlot[] = [
  { key: 'aix', main: 'cd' },
  { key: 'hoochief', main: 'spectro' },
  { key: 'junrock3', main: 'spectro' },
  { key: 'hoartoise', main: 'atk' },
  { key: 'junrock1', main: 'atk' },
]
export const COST_LIMIT = 12

/** The main stat an Echo carries by default (for an Echo swapped in from the planner). */
export const defaultMain = (key: string): MainId => {
  const echo = ECHO_POOL[key]
  return MAINS[echo.cost].find((m) => m.stat === echo.main[0])?.id ?? MAINS[echo.cost][0].id
}
export const mainOf = (slot: BuildSlot): MainOption => {
  const options = MAINS[ECHO_POOL[slot.key].cost]
  return options.find((m) => m.id === slot.main) ?? options[0]
}
export const echoOf = (slot: BuildSlot): SampleEcho => {
  const m = mainOf(slot)
  return { ...ECHO_POOL[slot.key], main: [m.stat, m.value] }
}
export const costOf = (slots: readonly BuildSlot[]): number => slots.reduce((sum, s) => sum + ECHO_POOL[s.key].cost, 0)

/** The planner's row for a slot. */
export const slotData = (slot: BuildSlot): EchoSlotData => {
  const e = echoOf(slot)
  return { cost: e.cost, name: e.name, set: e.set, main: `${e.main[0]} ${e.main[1]}`, subs: e.subs }
}

/** Her stat readout from the five Echoes (sample: base 5% Crit Rate, the weapon's 24.3%, base 150% Crit DMG). */
export function statsOf(slots: readonly BuildSlot[]): { critRate: number; critDmg: number; energy: number; set: number } {
  const echoes = slots.map(echoOf)
  const sum = (stat: string): number =>
    echoes.reduce((t, e) => t + [e.main, ...e.subs].filter(([k]) => k === stat).reduce((a, [, v]) => a + Number.parseFloat(v), 0), 0)
  const r = (n: number): number => Math.round(n * 10) / 10
  return {
    critRate: r(5 + 24.3 + sum('Crit Rate')),
    critDmg: r(150 + sum('Crit DMG')),
    energy: r(100 + sum('Energy Regen')),
    set: echoes.filter((e) => e.set === JINHSI_BUILD.sonata.name).length,
  }
}

/** Build links: `?build=aix.cd-hoochief.spectro-…`. Anything malformed or over the cost limit falls back to her build. */
export const encodeBuild = (slots: readonly BuildSlot[]): string => slots.map((s) => `${s.key}.${s.main}`).join('-')
export function decodeBuild(value: string | null): readonly BuildSlot[] {
  if (!value) return HER_SLOTS
  const slots = value.split('-').map((token) => {
    const [key, main] = token.split('.')
    return ECHO_POOL[key] && MAINS[ECHO_POOL[key].cost].some((m) => m.id === main) ? { key, main: main as MainId } : null
  })
  return slots.length === 5 && slots.every(Boolean) && costOf(slots as BuildSlot[]) <= COST_LIMIT ? (slots as BuildSlot[]) : HER_SLOTS
}

/** The eight Resonators with full-body art, in the order S6 shows them. */
export const START: readonly Resonator[] = ['jinhsi', 'changli', 'carlotta', 'camellya', 'shorekeeper', 'zhezhi', 'xiangli-yao', 'yinlin'].map(byId)

export const SECTIONS = [
  { id: 'build', label: 'Resonators', href: '#build' },
  { id: 'planner', label: 'Echo planner', href: '#planner' },
  { id: 'team', label: 'Team builder', href: '#team' },
  { id: 'banners', label: 'Banners', href: '#banners' },
] as const

/** The same four on phones, short enough to fit one row at 320 px. */
export const SECTIONS_SHORT = [
  { id: 'build', label: 'Builds', href: '#build' },
  { id: 'planner', label: 'Planner', href: '#planner' },
  { id: 'team', label: 'Team', href: '#team' },
  { id: 'banners', label: 'Banners', href: '#banners' },
] as const
