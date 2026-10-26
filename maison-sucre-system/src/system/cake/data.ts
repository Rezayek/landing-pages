/**
 * SAMPLE DATA for the playground. Every name, price, portion count, rule, address and date below is invented to
 * exercise the system and is labelled "sample" wherever it shows. None of it is Maison Sucre's. Captured 2026-10-25.
 * The portion guide follows the common 1 × 1 inch wedding-portion convention; the maker confirms the real numbers.
 */
import type { Petal } from '../ui'

export type Style = 'classic' | 'modern' | 'floral' | 'naked' | 'sculptural'
export type Shape = 'round' | 'square' | 'hexagon'
export type Finish = 'fondant' | 'buttercream' | 'semi-naked' | 'naked'
export type Flowers = 'none' | 'spray' | 'cascade' | 'crown'

export const STYLES: readonly { value: Style; label: string; petal: Petal }[] = [
  { value: 'classic', label: 'Classic', petal: 'classic' },
  { value: 'modern', label: 'Modern', petal: 'modern' },
  { value: 'floral', label: 'Floral', petal: 'floral' },
  { value: 'naked', label: 'Naked', petal: 'naked' },
  { value: 'sculptural', label: 'Sculptural', petal: 'sculptural' },
]

/** Each cake's own rendered study (blender/catalogue.py: its tiers, shape, finish and flowers, one studio for all). */
export const renderOf = (cake: Pick<Cake, 'id'>): string => `/system/cakes/${cake.id}.webp`

export interface Cake {
  id: string
  name: string
  style: Style
  tiers: number
  shape: Shape
  finish: Finish
  flowers: Flowers
  note: string
}

export const CAKES: readonly Cake[] = [
  { id: 'peony-cascade', name: 'Peony cascade', style: 'floral', tiers: 3, shape: 'round', finish: 'fondant', flowers: 'cascade', note: 'Sugar peonies and ranunculus falling from the top tier to the board.' },
  { id: 'pearl-lace', name: 'Pearl and lace', style: 'classic', tiers: 3, shape: 'round', finish: 'fondant', flowers: 'none', note: 'A piped lace band on the base tier and a bead border on every tier.' },
  { id: 'gilded-hexagon', name: 'Gilded hexagon', style: 'modern', tiers: 3, shape: 'hexagon', finish: 'fondant', flowers: 'none', note: 'Crisp hexagon tiers with one panel of pressed gold leaf.' },
  { id: 'orchard', name: 'Orchard', style: 'naked', tiers: 3, shape: 'round', finish: 'naked', flowers: 'spray', note: 'Vanilla sponge with the layers showing, a spray of sugar blossom and fresh figs.' },
  { id: 'drape', name: 'The drape', style: 'sculptural', tiers: 4, shape: 'round', finish: 'fondant', flowers: 'none', note: 'Fondant folded like silk around four tiers of different heights.' },
  { id: 'sweet-pea', name: 'Sweet pea', style: 'floral', tiers: 2, shape: 'round', finish: 'buttercream', flowers: 'crown', note: 'Palette-knife buttercream with a crown of sugar sweet peas.' },
  { id: 'court', name: 'Court', style: 'classic', tiers: 4, shape: 'square', finish: 'fondant', flowers: 'spray', note: 'Square tiers with Swiss dots and a single spray of white roses.' },
  { id: 'meadow', name: 'Meadow', style: 'naked', tiers: 2, shape: 'round', finish: 'semi-naked', flowers: 'spray', note: 'Semi-naked lemon sponge with wild sugar flowers.' },
  { id: 'ribbon', name: 'Ribbon', style: 'modern', tiers: 2, shape: 'square', finish: 'buttercream', flowers: 'none', note: 'Smooth buttercream with a hand-painted ribbon in garnet.' },
  { id: 'cloud', name: 'Cloud', style: 'sculptural', tiers: 3, shape: 'round', finish: 'buttercream', flowers: 'none', note: 'Buttercream swept into soft peaks, tier by tier.' },
  { id: 'heirloom', name: 'Heirloom', style: 'classic', tiers: 5, shape: 'round', finish: 'fondant', flowers: 'cascade', note: 'Five tiers with Lambeth over-piping and a cascade of sugar roses.' },
  { id: 'wild-rose', name: 'Wild rose', style: 'floral', tiers: 4, shape: 'round', finish: 'semi-naked', flowers: 'cascade', note: 'Semi-naked tiers wrapped in sugar wild roses.' },
]

export interface Flavour {
  id: string
  name: string
  sponge: string
  filling: string
  finish: string
  contains: readonly string[]
}

export const FLAVOURS: readonly Flavour[] = [
  { id: 'lemon-elderflower', name: 'Lemon and elderflower', sponge: 'Lemon sponge', filling: 'elderflower curd', finish: 'vanilla buttercream', contains: ['gluten', 'egg', 'milk'] },
  { id: 'vanilla-raspberry', name: 'Vanilla and raspberry', sponge: 'Vanilla bean sponge', filling: 'raspberry jam', finish: 'Swiss meringue buttercream', contains: ['gluten', 'egg', 'milk'] },
  { id: 'chocolate-caramel', name: 'Chocolate and salted caramel', sponge: 'Dark chocolate sponge', filling: 'salted caramel', finish: 'chocolate ganache', contains: ['gluten', 'egg', 'milk', 'soya'] },
  { id: 'pistachio-rose', name: 'Pistachio and rose', sponge: 'Pistachio sponge', filling: 'rose cream', finish: 'white chocolate ganache', contains: ['gluten', 'egg', 'milk', 'nuts'] },
  { id: 'earl-grey-honey', name: 'Earl Grey and honey', sponge: 'Earl Grey sponge', filling: 'honey buttercream', finish: 'vanilla buttercream', contains: ['gluten', 'egg', 'milk'] },
  { id: 'coconut-lime', name: 'Coconut and lime', sponge: 'Coconut sponge', filling: 'lime curd', finish: 'coconut buttercream', contains: ['gluten', 'egg', 'milk'] },
  { id: 'hazelnut-praline', name: 'Hazelnut praline', sponge: 'Brown butter sponge', filling: 'hazelnut praline', finish: 'milk chocolate ganache', contains: ['gluten', 'egg', 'milk', 'nuts'] },
  { id: 'carrot-orange', name: 'Carrot and orange', sponge: 'Spiced carrot sponge', filling: 'orange cream cheese', finish: 'cream cheese frosting', contains: ['gluten', 'egg', 'milk', 'nuts'] },
]

/** Tier sizes in inches for each tier count, top to bottom. */
export const TIER_SIZES: Record<number, readonly number[]> = {
  1: [8],
  2: [6, 8],
  3: [6, 8, 10],
  4: [6, 8, 10, 12],
  5: [4, 6, 8, 10, 12],
}

/** Wedding portions (1 × 1 inch, tiers 4 inch tall) by size and shape. Sample guide. */
const PORTIONS: Record<Shape, Record<number, number>> = {
  round: { 4: 6, 6: 12, 8: 24, 10: 38, 12: 56 },
  square: { 4: 8, 6: 18, 8: 32, 10: 50, 12: 72 },
  hexagon: { 4: 6, 6: 11, 8: 22, 10: 34, 12: 50 },
}

export function portionsFor(tiers: number, shape: Shape): number {
  return (TIER_SIZES[tiers] ?? TIER_SIZES[3]).reduce((sum, size) => sum + PORTIONS[shape][size], 0)
}

/** The smallest cake (tiers, shape round) that serves `guests`, or null when none does. */
export function tiersForGuests(guests: number, shape: Shape = 'round'): number | null {
  for (let t = 1; t <= 5; t++) if (portionsFor(t, shape) >= guests) return t
  return null
}

export const GUESTS = { min: 20, max: 400 } as const // sample limits

/* The sample price model ------------------------------------------------------------------------------------- */
const PER_PORTION: Record<Finish, number> = { fondant: 5.5, buttercream: 4.5, 'semi-naked': 4.2, naked: 4 }
const SHAPE_FACTOR: Record<Shape, number> = { round: 1, square: 1.1, hexagon: 1.15 }
const FLOWERS_PRICE: Record<Flowers, number> = { none: 0, spray: 60, cascade: 180, crown: 120 }
const GOLD_LEAF = 45
const DELIVERY_NOTE = 'with delivery within 20 miles'

export interface Design {
  tiers: number
  shape: Shape
  finish: Finish
  flowers: Flowers
  goldLeaf: boolean
  /** One flavour id per tier, top to bottom. */
  flavours: readonly string[]
}

export const DEFAULT_DESIGN: Design = { tiers: 1, shape: 'round', finish: 'fondant', flowers: 'none', goldLeaf: false, flavours: ['vanilla-raspberry'] }

export interface PriceRange {
  low: number
  high: number
  portions: number
  note: string
}

const round10 = (n: number): number => Math.round(n / 10) * 10

/** The sample price range: the low end from the model, the high end 20 % above for detail work. */
export function priceFor(design: Design): PriceRange {
  const portions = portionsFor(design.tiers, design.shape)
  const base = portions * PER_PORTION[design.finish] * SHAPE_FACTOR[design.shape]
  const low = round10(base + FLOWERS_PRICE[design.flowers] + (design.goldLeaf ? GOLD_LEAF : 0))
  return { low, high: round10(low * 1.2), portions, note: `Sample price, ${DELIVERY_NOTE}` }
}

export const pounds = (n: number): string => `£${n.toLocaleString('en-GB')}`

/** Hexagon cakes go up to four tiers (sample rule). */
export const HEXAGON_MAX_TIERS = 4

/* Tastings, delivery, FAQ ---------------------------------------------------------------------------------------- */
export const SLOT_TIMES = ['10:00', '11:00', '12:30', '14:00', '15:30', '17:00'] as const

/** Sample availability: no tastings on Mondays (the kitchen bakes), and a few days fully booked. */
export function dayRule(date: Date, today: Date): { unavailable?: string } {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
  if (date < start) return { unavailable: 'too soon' }
  if (date.getDay() === 1) return { unavailable: 'the kitchen bakes on Mondays' }
  if ((date.getDate() * 7 + date.getMonth()) % 11 === 0) return { unavailable: 'full' }
  return {}
}

/** Slots for a day: deterministic, with one or two already taken. */
export function slotsFor(date: Date): { time: string; taken: boolean }[] {
  const seed = date.getDate() + date.getMonth() * 31
  return SLOT_TIMES.map((time, i) => ({ time, taken: (seed + i * 3) % 5 === 0 }))
}

export const DELIVERY_AREAS = ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'] as const // sample: London

const POSTCODE = /^([A-Z]{1,2})\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export type DeliveryResult =
  | { kind: 'delivers'; area: string }
  | { kind: 'outside'; area: string }
  | { kind: 'monday' }

export function normalisePostcode(input: string): string | null {
  const t = input.trim().toUpperCase().replace(/\s+/g, '')
  if (!POSTCODE.test(t)) return null
  return `${t.slice(0, -3)} ${t.slice(-3)}`
}

export function checkDelivery(postcode: string, date: Date): DeliveryResult {
  const area = /^[A-Z]+/.exec(postcode)?.[0] ?? ''
  if (date.getDay() === 1) return { kind: 'monday' }
  return (DELIVERY_AREAS as readonly string[]).includes(area) ? { kind: 'delivers', area: postcode.split(' ')[0] } : { kind: 'outside', area: postcode.split(' ')[0] }
}

export const FAQ: readonly { id: string; question: string; answer: string }[] = [
  { id: 'lead', question: 'How far ahead should we book?', answer: 'Most couples book six to nine months ahead; sugar flowers take days to shape and dry. (Sample answer.)' },
  { id: 'tasting', question: 'What happens at a tasting?', answer: 'You taste up to six flavours you kept, talk through the design, and leave with a sketch and a quote. (Sample answer.)' },
  { id: 'gluten', question: 'Can you bake gluten-free tiers?', answer: 'Yes: any tier can be gluten-free, baked separately. Tell us at the tasting. (Sample answer.)' },
  { id: 'vegan', question: 'Do you make vegan cakes?', answer: 'Three of our flavours have vegan versions; buttercream finishes work best. (Sample answer.)' },
  { id: 'delivery', question: 'Do you deliver and set up?', answer: 'We deliver and set up within 20 miles of the kitchen, Tuesday to Saturday. Further away, ask us. (Sample answer.)' },
  { id: 'flowers', question: 'Are the flowers edible?', answer: 'Sugar flowers are made of sugar paste on wire: lovely to keep, not to eat. We never put fresh flowers on cake without food-safe wraps. (Sample answer.)' },
  { id: 'deposit', question: 'How do we secure our date?', answer: 'A deposit holds your date once you accept the quote; the rest is due two weeks before. (Sample answer.)' },
  { id: 'portions', question: 'How many portions do we need?', answer: 'Plan one wedding portion per guest; dessert portions are twice the size. The servings guide shows both. (Sample answer.)' },
  { id: 'stand', question: 'Do you lend cake stands?', answer: 'Yes, a choice of stands, returned after the day. (Sample answer.)' },
]
