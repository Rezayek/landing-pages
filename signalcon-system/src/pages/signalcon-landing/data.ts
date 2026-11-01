/**
 * Every fact on the SIGNAL//CON page. FICTIONAL SAMPLES for a design study, written 2026-11-01 (BRIEF.md): the event,
 * the guests, the times, the prices and the stock do not exist. The footer says so; the stock line says "sample".
 */

export const EVENT = {
  name: 'SIGNAL//CON 2027',
  dates: '23–25 July 2027',
  datesShort: '23–25 Jul 2027',
  datesMono: '23–25.07.27',
  venue: 'Relay Hall',
  address: '4 Ferry Lane, Canal Ward, Varo City',
  district: 'Canal Ward, Varo City',
  capturedOn: '2026-11-01',
} as const

export type KindId = 'concert' | 'panel' | 'cosplay' | 'artist' | 'game'

export interface Kind {
  id: KindId
  title: string
  plural: string
  line: string
  fact: string
  days: string
}

export const KINDS: readonly Kind[] = [
  { id: 'concert', title: 'Concerts', plural: 'concerts', line: 'Two night shows on the main stage, Friday and Saturday.', fact: 'FRI + SAT · 20:00', days: 'Friday and Saturday' },
  { id: 'panel', title: 'Panels', plural: 'panels', line: 'Creators, voice actors and devs on stage, with Q&A.', fact: '24 panels · all 3 days', days: 'all three days' },
  { id: 'cosplay', title: 'Cosplay', plural: 'cosplay events', line: 'Walk-ons, a photo wall, and the Masters final on Saturday.', fact: 'Masters final · SAT 15:00', days: 'Saturday and Sunday' },
  { id: 'artist', title: 'Artist alley', plural: 'artist alley events', line: 'Prints, pins and commissions from independent artists.', fact: '120 tables · all 3 days', days: 'all three days' },
  { id: 'game', title: 'Game demos', plural: 'game demo events', line: "Try games that aren't out yet. 15-minute slots.", fact: '40 stations · all 3 days', days: 'all three days' },
]

export type DayId = 'fri' | 'sat' | 'sun'

export interface Day {
  id: DayId
  name: string
  short: string
  date: string
  doors: string
}

export const DAYS: readonly Day[] = [
  { id: 'fri', name: 'Friday', short: 'Fri', date: '23', doors: '12:00–23:30' },
  { id: 'sat', name: 'Saturday', short: 'Sat', date: '24', doors: '10:00–23:30' },
  { id: 'sun', name: 'Sunday', short: 'Sun', date: '25', doors: '10:00–19:00' },
]

export interface Slot {
  day: DayId
  time: string
  title: string
  place: string
  kind: KindId
  main?: boolean
}

export const SCHEDULE: readonly Slot[] = [
  { day: 'fri', time: '12:30', title: 'Artist alley opens', place: 'Hall C', kind: 'artist' },
  { day: 'fri', time: '13:00', title: 'Demo floor opens', place: 'Demo zone', kind: 'game' },
  { day: 'fri', time: '14:00', title: 'Making a monster-tamer in 18 months', place: 'Panel 1', kind: 'panel' },
  { day: 'fri', time: '15:00', title: 'Juno Abara: Low Orbit Laundromat live demo', place: 'Demo zone', kind: 'game' },
  { day: 'fri', time: '16:30', title: 'Voice acting 101', place: 'Panel 2', kind: 'panel' },
  { day: 'fri', time: '17:30', title: 'Speedrun showcase', place: 'Demo zone', kind: 'game' },
  { day: 'fri', time: '20:00', title: 'Opening night: KITE//9', place: 'Main stage', kind: 'concert', main: true },
  { day: 'sat', time: '10:30', title: 'Cosplay walk-on', place: 'Hall B', kind: 'cosplay' },
  { day: 'sat', time: '11:00', title: 'Portfolio reviews', place: 'Hall C', kind: 'artist' },
  { day: 'sat', time: '12:00', title: 'Webcomics to print', place: 'Panel 2', kind: 'panel' },
  { day: 'sat', time: '13:00', title: 'Character Design Masterclass: Drawing Motion, with Mireille Okonkwo-Hayashi', place: 'Panel 1', kind: 'panel' },
  { day: 'sat', time: '14:00', title: 'Indie showcase', place: 'Demo zone', kind: 'game' },
  { day: 'sat', time: '15:00', title: 'Cosplay Masters final, judged by RINSE', place: 'Hall B', kind: 'cosplay' },
  { day: 'sat', time: '16:30', title: 'Taro Venn: live dubbing', place: 'Main stage', kind: 'panel' },
  { day: 'sat', time: '18:00', title: 'Prop-making clinic', place: 'Hall B', kind: 'cosplay' },
  { day: 'sat', time: '20:00', title: 'Static Bloom live', place: 'Main stage', kind: 'concert', main: true },
  { day: 'sun', time: '10:30', title: 'Sketch jam', place: 'Hall C', kind: 'artist' },
  { day: 'sun', time: '11:00', title: 'Cosplay photo walk', place: 'Hall B', kind: 'cosplay' },
  { day: 'sun', time: '12:00', title: 'Sable Quist: 30 years of ink', place: 'Panel 2', kind: 'panel', main: true },
  { day: 'sun', time: '13:30', title: 'Tournament finals', place: 'Demo zone', kind: 'game' },
  { day: 'sun', time: '15:00', title: 'How dubbing studios cast', place: 'Panel 1', kind: 'panel' },
  { day: 'sun', time: '16:00', title: 'Artist alley last call', place: 'Hall C', kind: 'artist' },
  { day: 'sun', time: '17:30', title: 'Closing ceremony', place: 'Main stage', kind: 'panel' },
]

export interface Guest {
  id: string
  name: string
  role: string
  slot: string
  day: DayId
  image: string
  initials: string
  bio: string
  slots: readonly string[]
}

export const GUESTS: readonly Guest[] = [
  { id: 'kite9', name: 'KITE//9', role: 'Electronic duo, Friday night headliner', slot: 'FRI · 20:00 · Main stage', day: 'fri', image: '/signalcon-landing/art/guest-kite9.webp', initials: 'K9', bio: 'A two-piece who score late-night racing games and then play them live, louder. Expect a 90-minute set and visuals made for the Relay Hall screens.', slots: ['Fri 20:00 · Opening night concert · Main stage'] },
  { id: 'mireille', name: 'Mireille Okonkwo-Hayashi', role: 'Character designer', slot: 'SAT · 13:00 · Panel 1', day: 'sat', image: '/signalcon-landing/art/guest-mireille.webp', initials: 'MO', bio: 'Designs characters for animated series and games. Her masterclass draws one character in motion, start to finish, with questions as she goes.', slots: ['Sat 13:00 · Character Design Masterclass: Drawing Motion · Panel 1'] },
  { id: 'taro', name: 'Taro Venn', role: 'Voice actor', slot: 'SAT · 16:30 · Main stage', day: 'sat', image: '/signalcon-landing/art/guest-taro.webp', initials: 'TV', bio: 'Voices heroes and villains in games and dubs. He will dub a scene live on stage, then take questions about the booth.', slots: ['Sat 16:30 · Live dubbing · Main stage'] },
  { id: 'juno', name: 'Juno Abara', role: 'Game director, Low Orbit Laundromat', slot: 'FRI · 15:00 · Demo zone', day: 'fri', image: '/signalcon-landing/art/guest-juno.webp', initials: 'JA', bio: 'Leads a small studio making a cosy sci-fi management game. She brings a playable build and plays it with the crowd.', slots: ['Fri 15:00 · Low Orbit Laundromat live demo · Demo zone'] },
  { id: 'rinse', name: 'RINSE', role: 'Cosplayer, Masters final judge', slot: 'SAT · 15:00 · Hall B', day: 'sat', image: '/signalcon-landing/art/guest-rinse.webp', initials: 'RI', bio: 'Builds foam armour and paints faces for a living. Judges the Masters final and runs a prop clinic after it.', slots: ['Sat 15:00 · Cosplay Masters final · Hall B', 'Sat 18:00 · Prop-making clinic · Hall B'] },
  { id: 'sable', name: 'Sable Quist', role: 'Manga artist', slot: 'SUN · 12:00 · Panel 2', day: 'sun', image: '/signalcon-landing/art/guest-sable.webp', initials: 'SQ', bio: 'Thirty years of brush-pen comics. Talks through his pages from first sketch to print, and signs for VIP token holders after.', slots: ['Sun 12:00 · 30 years of ink · Panel 2'] },
]

export type TierId = 'day' | 'three' | 'vip'

export interface Tier {
  id: TierId
  name: string
  price: number
  perDay: string
  line: string
  includes: readonly string[]
  featured?: boolean
  sticker?: string
}

export const TIERS: readonly Tier[] = [
  { id: 'day', name: '1-Day', price: 39, perDay: '€39 a day', line: "One day of your choice. Fri and Sat include that night's concert.", includes: ['Entry from doors to close', 'Every panel and demo', "That night's concert (Fri and Sat)"] },
  { id: 'three', name: '3-Day', price: 89, perDay: '€29.67 a day, €28 less than three 1-Day passes', line: 'All three days and both concerts.', includes: ['Entry all 3 days, with re-entry', 'Both night concerts', 'Every panel and demo'], featured: true, sticker: 'Best value' },
  { id: 'vip', name: 'VIP 3-Day', price: 189, perDay: '€63 a day', line: 'Everything in 3-Day, plus early entry and a skip past the morning line.', includes: ['Early entry one hour before doors', 'Reserved concert pit', '2 autograph tokens (one signature each)', 'A SIGNAL//CON tote'] },
]

/** Sample stock at page load: [left, total]. The simulated feed lowers it while the tickets section is on screen. */
export const STOCK_START: Readonly<Record<'three' | 'vip' | DayId, readonly [number, number]>> = {
  three: [412, 1500],
  vip: [37, 300],
  fri: [1240, 3000],
  sat: [0, 3000],
  sun: [860, 3000],
}

export const FAQ: readonly { q: string; a: string }[] = [
  { q: 'Can I get a refund?', a: 'Yes, in full, until 1 June 2027. After that, no refunds, but you can transfer your pass.' },
  { q: 'Can I give my pass to a friend?', a: 'Yes. Change the name on it for free until 20 July 2027.' },
  { q: 'What if a guest cancels?', a: 'Lineups can change. If a headliner cancels, you can get a refund until 7 days before the event.' },
  { q: 'How do I get my pass?', a: 'By email, as a QR code that works from your phone. Swap it for a wristband at the gate.' },
  { q: 'Is there an age limit?', a: 'Under 14s need an adult with them. Under 10s get in free with a paying adult.' },
  { q: 'Can I leave and come back?', a: 'Yes. Show your wristband to come back in. 3-Day and VIP passes work on all three days.' },
  { q: 'Can I bring cosplay props?', a: 'Yes, if each prop is under 3 kg with no sharp points. Staff check props at Gate A.' },
  { q: 'Is the venue accessible?', a: "Gate B is step-free, every hall has a lift, and a carer gets in free. Write to access@signalcon.example before you come and we'll save you a seat." },
  { q: 'Can I buy at the door?', a: 'Yes, if passes are left that day, for €5 more than online.' },
]

export const TRAVEL = [
  { id: 'tram', text: 'Tram 3 to the Relay Hall stop, then 2 minutes on foot' },
  { id: 'night', text: 'Night tram N3 runs every 15 minutes until 02:30, after the concerts' },
  { id: 'bike', text: 'Bike parking at the Ferry Lane gate' },
  { id: 'access', text: 'Step-free entrance at Gate B' },
] as const

export const NOTICE =
  'SIGNAL//CON 2027 is a fictional event made as a design study. No tickets are sold and nothing you type is sent. Names, prices, stock and times are samples.'

export const euro = (n: number): string => `€${n.toLocaleString('en')}`
