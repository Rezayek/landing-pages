/**
 * Sample data for the playground (SYSTEM.md §Project: "real Resonator, weapon and Echo set names").
 *
 * Names, elements, weapons and rarities are public facts about the game, written from public knowledge on
 * 2026-10-24 and not checked against a live data source: the real app replaces this file with a dated data feed.
 * Every number (stats, targets, countdown ends, counts) is invented for the demos and is labelled "sample" wherever
 * it is shown. No art, icon or text is taken from the game.
 */
import type { Element } from './icons'

export type Weapon = 'Broadblade' | 'Sword' | 'Pistols' | 'Gauntlets' | 'Rectifier'
export type Rarity = 4 | 5

export interface Resonator {
  readonly id: string
  readonly name: string
  readonly element: Element
  readonly weapon: Weapon
  readonly rarity: Rarity
  readonly role: 'Main DPS' | 'Sub DPS' | 'Support'
}

const r = (name: string, element: Element, weapon: Weapon, rarity: Rarity, role: Resonator['role']): Resonator => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, '-'),
  name,
  element,
  weapon,
  rarity,
  role,
})

export const RESONATORS: readonly Resonator[] = [
  r('Jinhsi', 'spectro', 'Broadblade', 5, 'Main DPS'),
  r('Carlotta', 'glacio', 'Pistols', 5, 'Main DPS'),
  r('Camellya', 'havoc', 'Sword', 5, 'Main DPS'),
  r('Changli', 'fusion', 'Sword', 5, 'Main DPS'),
  r('Shorekeeper', 'spectro', 'Rectifier', 5, 'Support'),
  r('Zhezhi', 'glacio', 'Rectifier', 5, 'Sub DPS'),
  r('Xiangli Yao', 'electro', 'Gauntlets', 5, 'Main DPS'),
  r('Yinlin', 'electro', 'Rectifier', 5, 'Sub DPS'),
  r('Jiyan', 'aero', 'Broadblade', 5, 'Main DPS'),
  r('Verina', 'spectro', 'Rectifier', 5, 'Support'),
  r('Encore', 'fusion', 'Rectifier', 5, 'Main DPS'),
  r('Calcharo', 'electro', 'Broadblade', 5, 'Main DPS'),
  r('Lingyang', 'glacio', 'Gauntlets', 5, 'Main DPS'),
  r('Jianxin', 'aero', 'Gauntlets', 5, 'Support'),
  r('Roccia', 'havoc', 'Gauntlets', 5, 'Sub DPS'),
  r('Phoebe', 'spectro', 'Rectifier', 5, 'Main DPS'),
  r('Brant', 'fusion', 'Sword', 5, 'Support'),
  r('Cantarella', 'havoc', 'Rectifier', 5, 'Sub DPS'),
  r('Zani', 'spectro', 'Gauntlets', 5, 'Main DPS'),
  r('Ciaccona', 'aero', 'Pistols', 5, 'Sub DPS'),
  r('Cartethyia', 'aero', 'Sword', 5, 'Main DPS'),
  r('Sanhua', 'glacio', 'Sword', 4, 'Sub DPS'),
  r('Baizhi', 'glacio', 'Rectifier', 4, 'Support'),
  r('Chixia', 'fusion', 'Pistols', 4, 'Main DPS'),
  r('Danjin', 'havoc', 'Sword', 4, 'Main DPS'),
  r('Mortefi', 'fusion', 'Pistols', 4, 'Sub DPS'),
  r('Taoqi', 'havoc', 'Broadblade', 4, 'Support'),
  r('Yangyang', 'aero', 'Sword', 4, 'Support'),
  r('Yuanwu', 'electro', 'Gauntlets', 4, 'Sub DPS'),
  r('Aalto', 'aero', 'Pistols', 4, 'Sub DPS'),
  r('Lumi', 'electro', 'Broadblade', 4, 'Sub DPS'),
  r('Youhu', 'glacio', 'Gauntlets', 4, 'Support'),
]

export const WEAPONS: readonly Weapon[] = ['Broadblade', 'Sword', 'Pistols', 'Gauntlets', 'Rectifier']

export const byId = (id: string): Resonator => RESONATORS.find((item) => item.id === id) ?? RESONATORS[0]

/**
 * Official portrait cards (366x731, © Kuro Games), used in this non-commercial test playground with credit
 * (public/resonators/CREDITS.md). Resonators not listed keep the drawn sigil plate.
 */
const PORTRAITS: ReadonlySet<string> = new Set([
  'jinhsi', 'changli', 'xiangli-yao', 'zhezhi', 'yinlin', 'jiyan', 'lingyang', 'verina', 'jianxin', 'taoqi', 'yuanwu',
  'danjin', 'mortefi', 'sanhua', 'baizhi', 'chixia', 'yangyang', 'youhu',
])

export const portraitOf = (id: string): string | null => (PORTRAITS.has(id) ? `/resonators/${id}.png` : null)

/**
 * Official full-body cut-outs (1536x1524 WebP, © Kuro Games, credited in public/resonators/full/CREDITS.md). A place
 * with no portrait card can crop one of these to the head and shoulders before it falls back to the sigil.
 */
const FULL_BODY: ReadonlySet<string> = new Set(['jinhsi', 'changli', 'carlotta', 'camellya', 'shorekeeper', 'zhezhi', 'xiangli-yao', 'yinlin'])

export const fullBodyOf = (id: string): string | null => (FULL_BODY.has(id) ? `/resonators/full/${id}.webp` : null)

/** Echo slots of a sample build. Stats are sample numbers. */
export interface EchoSlotData {
  readonly cost: 4 | 3 | 1
  readonly name: string | null
  readonly set: string
  readonly main: string
  readonly subs: readonly (readonly [string, string])[]
}

export const SAMPLE_ECHOES: readonly EchoSlotData[] = [
  { cost: 4, name: 'Mourning Aix', set: 'Celestial Light', main: 'Crit DMG 44.0%', subs: [['Crit Rate', '8.1%'], ['ATK%', '9.4%'], ['Energy Regen', '10.0%']] },
  { cost: 3, name: 'Hoochief', set: 'Celestial Light', main: 'Spectro DMG 30.0%', subs: [['Crit DMG', '15.0%'], ['ATK', '40']] },
  { cost: 3, name: 'Fission Junrock', set: 'Celestial Light', main: 'Spectro DMG 30.0%', subs: [['Crit Rate', '6.9%'], ['Basic DMG', '8.6%']] },
  { cost: 1, name: 'Hoartoise', set: 'Celestial Light', main: 'ATK 18.0%', subs: [['Crit Rate', '7.5%']] },
  { cost: 1, name: null, set: '', main: '', subs: [] },
]

/** Banners on Home and the calendar. End times are sample values relative to the page load. */
export interface BannerData {
  readonly id: string
  readonly kind: 'Featured Resonator' | 'Featured weapon' | 'Event'
  readonly title: string
  readonly resonator?: string
  readonly endsInMs: number
  readonly rerun?: boolean
}

export const SAMPLE_BANNERS: readonly BannerData[] = [
  { id: 'changli', kind: 'Featured Resonator', title: 'Changli', resonator: 'changli', endsInMs: (6 * 24 + 14) * 3600_000 + 22 * 60_000 },
  { id: 'jinhsi', kind: 'Featured Resonator', title: 'Jinhsi', resonator: 'jinhsi', endsInMs: 20 * 3600_000, rerun: true },
  { id: 'tower', kind: 'Event', title: 'Tower of Adversity', endsInMs: 3 * 24 * 3600_000 },
]

export const SAMPLE_NOTE = 'Sample data: names from public game knowledge, numbers invented for the demo.'

/* ------------------------------------------------------------------------------------------------------------
   Sample build for the Resonator page (Jinhsi). Structure mirrors the in-game Resonator menu: Attributes, Weapon,
   Echo (with Sonata effects), Resonance Chain and Forte. Names are the game's; every number and every description
   here is SAMPLE text written for the demo, not copied from the game. Icons: gameIcons.ts (credited).
   ------------------------------------------------------------------------------------------------------------ */
import type { GameIconKey } from './gameIcons'

export interface SampleWeapon {
  readonly name: string
  readonly type: Weapon
  readonly rarity: 3 | 4 | 5
  readonly level: string
  readonly baseAtk: string
  readonly secondary: readonly [string, string]
  readonly rank: number
  readonly passiveText: string
  readonly icon: GameIconKey
}

export interface SampleEcho {
  readonly name: string
  readonly cost: 4 | 3 | 1
  readonly level: number
  readonly set: string
  readonly main: readonly [string, string]
  readonly fixed: readonly [string, string]
  readonly subs: readonly (readonly [string, string])[]
  /** null when the data has no icon yet (a new Echo): the card shows our fallback. */
  readonly icon: GameIconKey | null
}

export interface SampleSkill {
  readonly id: string
  readonly kind: 'Basic Attack' | 'Resonance Skill' | 'Forte Circuit' | 'Resonance Liberation' | 'Intro Skill' | 'Outro Skill' | 'Inherent Skill'
  readonly name: string
  readonly level: number
  readonly max: number
  readonly priority?: 1 | 2 | 3
  readonly text: string
  readonly icon: GameIconKey
}

export interface SampleChainNode {
  readonly seq: string
  readonly name: string
  readonly icon: GameIconKey
}

export const JINHSI_BUILD = {
  resonator: 'jinhsi',
  level: '90/90',
  attributes: [
    ['HP', '10,825'],
    ['ATK', '2,104'],
    ['DEF', '1,197'],
    ['Energy Regen', '110.0%'],
    ['Crit Rate', '64.2%'],
    ['Crit DMG', '212.0%'],
    ['Spectro DMG Bonus', '60.0%'],
    ['Resonance Skill DMG Bonus', '12.0%'],
  ] as const,
  weapon: {
    name: 'Ages of Harvest',
    type: 'Broadblade',
    rarity: 5,
    level: '90/90',
    baseAtk: '588',
    secondary: ['Crit Rate', '24.3%'],
    rank: 1,
    passiveText: 'Sample passive text: raises attribute damage, and Resonance Skill damage after an Intro Skill. The real app reads the passive from the data feed.',
    icon: 'weaponAgesOfHarvest',
  } satisfies SampleWeapon,
  sonata: {
    name: 'Celestial Light',
    icon: 'setCelestialLight' as GameIconKey,
    pieces: [
      ['2-Piece', 'Spectro DMG +10% (sample text)'],
      ['5-Piece', 'Spectro DMG +30% for a while after an Intro Skill (sample text)'],
    ] as const,
  },
  echoes: [
    { name: 'Mourning Aix', cost: 4, level: 25, set: 'Celestial Light', main: ['Crit DMG', '44.0%'], fixed: ['ATK', '150'], subs: [['Crit Rate', '8.1%'], ['ATK', '9.4%'], ['Energy Regen', '10.0%'], ['Resonance Skill DMG Bonus', '8.6%'], ['ATK', '40']], icon: 'echoMourningAix' },
    { name: 'Hoochief', cost: 3, level: 25, set: 'Celestial Light', main: ['Spectro DMG Bonus', '30.0%'], fixed: ['ATK', '100'], subs: [['Crit DMG', '15.0%'], ['ATK', '7.9%']], icon: 'echoHoochief' },
    { name: 'Fission Junrock', cost: 3, level: 25, set: 'Celestial Light', main: ['Spectro DMG Bonus', '30.0%'], fixed: ['ATK', '100'], subs: [['Crit Rate', '6.9%'], ['Basic Attack DMG Bonus', '8.6%']], icon: 'echoFissionJunrock' },
    { name: 'Hoartoise', cost: 1, level: 25, set: 'Celestial Light', main: ['ATK', '18.0%'], fixed: ['HP', '2,280'], subs: [['Crit Rate', '7.5%']], icon: 'echoHoartoise' },
    { name: 'Fission Junrock', cost: 1, level: 20, set: 'Celestial Light', main: ['ATK', '18.0%'], fixed: ['HP', '2,280'], subs: [['Crit DMG', '13.8%']], icon: 'echoFissionJunrock' },
  ] satisfies SampleEcho[],
  chain: {
    unlocked: 2,
    nodes: [
      { seq: 'S1', name: 'Abyssal Ascension', icon: 'chain1' },
      { seq: 'S2', name: 'Chronofrost Repose', icon: 'chain2' },
      { seq: 'S3', name: 'Celestial Incarnate', icon: 'chain3' },
      { seq: 'S4', name: 'Benevolent Grace', icon: 'chain4' },
      { seq: 'S5', name: 'Frostfire Illumination', icon: 'chain5' },
      { seq: 'S6', name: 'Thawing Triumph', icon: 'chain6' },
    ] satisfies SampleChainNode[],
  },
  forte: [
    { id: 'basic', kind: 'Basic Attack', name: 'Slash of Breaking Dawn', level: 6, max: 10, priority: 3, text: 'Sample text: a chain of broadblade strikes.', icon: 'skillBasic' },
    { id: 'resonance', kind: 'Resonance Skill', name: 'Trailing Lights of Eons', level: 10, max: 10, priority: 1, text: 'Sample text: her main damage window; level this first.', icon: 'skillResonance' },
    { id: 'forte', kind: 'Forte Circuit', name: 'Luminal Synthesis', level: 10, max: 10, priority: 1, text: 'Sample text: builds stacks that empower the Resonance Skill.', icon: 'skillForte' },
    { id: 'liberation', kind: 'Resonance Liberation', name: 'Purge of Light', level: 8, max: 10, priority: 2, text: 'Sample text: a burst of Spectro damage.', icon: 'skillLiberation' },
    { id: 'intro', kind: 'Intro Skill', name: "Loong's Halo", level: 6, max: 10, priority: 3, text: 'Sample text: an entrance strike when she swaps in.', icon: 'skillIntro' },
    { id: 'outro', kind: 'Outro Skill', name: 'Temporal Bender', level: 1, max: 1, text: 'Sample text: a buff for the next Resonator.', icon: 'skillOutro' },
    { id: 'inherent-1', kind: 'Inherent Skill', name: 'Radiant Surge', level: 1, max: 1, text: 'Sample text: a passive bonus.', icon: 'skillInherent1' },
    { id: 'inherent-2', kind: 'Inherent Skill', name: 'Converged Flash', level: 1, max: 1, text: 'Sample text: a second passive bonus.', icon: 'skillInherent2' },
  ] satisfies SampleSkill[],
}