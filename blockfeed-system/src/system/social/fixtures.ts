/**
 * Everything in this file is INVENTED for the design system: the players, builds, servers, groups, events and messages
 * are fictional, and no name here belongs to a real person, server or world. They exist so every component has honest,
 * varied content to show (long titles, big counts, empty fields). Replace them with real data in the app.
 */
import type { Biome, Structure } from '../pixel/textures'

export interface Player {
  readonly id: string
  readonly name: string
  readonly bio: string
  readonly level: number
  readonly xp: number
  readonly xpMax: number
  readonly followers: number
  readonly following: number
  readonly builds: number
  readonly presence: 'online' | 'away' | 'off'
  readonly joined: string
  readonly role?: 'Builder' | 'Moderator'
}

export const PLAYERS: readonly Player[] = [
  { id: 'pebblewren', name: 'PebbleWren', bio: 'Cliffside keeps and lantern bridges. Survival first, always.', level: 42, xp: 340, xpMax: 500, followers: 1284, following: 96, builds: 38, presence: 'online', joined: 'March 2024', role: 'Builder' },
  { id: 'quillfox', name: 'Quillfox', bio: 'Redstone tinkerer. I build tiny towns that actually work.', level: 31, xp: 120, xpMax: 400, followers: 642, following: 210, builds: 21, presence: 'away', joined: 'June 2024' },
  { id: 'harbormoth', name: 'HarborMoth', bio: 'Coastal builds, lighthouses, and far too many boats.', level: 57, xp: 410, xpMax: 600, followers: 3920, following: 58, builds: 64, presence: 'online', joined: 'January 2023', role: 'Builder' },
  { id: 'tallowknight', name: 'TallowKnight', bio: 'Castles, but make them cosy.', level: 24, xp: 60, xpMax: 300, followers: 288, following: 140, builds: 12, presence: 'off', joined: 'February 2025' },
  { id: 'birchlantern', name: 'BirchLantern', bio: 'Moderator on Mossgate. Ask me about build rules.', level: 49, xp: 200, xpMax: 500, followers: 871, following: 304, builds: 17, presence: 'online', joined: 'August 2023', role: 'Moderator' },
  { id: 'ottercircuit', name: 'OtterCircuit', bio: 'Small builds, big details.', level: 15, xp: 90, xpMax: 200, followers: 94, following: 77, builds: 9, presence: 'off', joined: 'May 2025' },
  { id: 'sunkenpine', name: 'SunkenPine', bio: 'Terraforming and snowed-in cottages.', level: 36, xp: 260, xpMax: 400, followers: 512, following: 128, builds: 29, presence: 'away', joined: 'October 2023' },
  { id: 'marblerook', name: 'MarbleRook', bio: 'Desert cities, one block at a time.', level: 28, xp: 150, xpMax: 400, followers: 377, following: 65, builds: 16, presence: 'off', joined: 'April 2024' },
]

/** The signed-in player in every scenario. */
export const ME = PLAYERS[1]

export const playerById = (id: string): Player => PLAYERS.find((p) => p.id === id) ?? PLAYERS[0]

export interface Build {
  readonly id: string
  readonly title: string
  readonly author: string
  readonly biome: Biome
  readonly structure: Structure
  /** which procedural landscape the screenshot draws */
  readonly shot: number
  readonly seed: string
  readonly coords: readonly [number, number, number]
  readonly version: string
  readonly mode: 'Survival' | 'Creative'
  readonly tags: readonly string[]
  readonly likes: number
  readonly comments: number
  readonly saves: number
  readonly posted: string
  readonly blurb: string
  readonly featured?: string
}

export const BUILDS: readonly Build[] = [
  { id: 'lantern-keep', title: 'Lantern Keep on the Cliffs', author: 'pebblewren', biome: 'dusk', structure: 'castle', shot: 3, seed: '482913776', coords: [124, 72, -310], version: '1.21', mode: 'Survival', tags: ['castle', 'cliffside', 'lighting'], likes: 842, comments: 61, saves: 190, posted: '2 hours ago', blurb: 'Three towers, a drawbridge, and 400 lanterns. Built over a season on a survival world, no creative mode.', featured: 'Challenge winner' },
  { id: 'mossgate-bridge', title: 'Mossgate Bridge', author: 'harbormoth', biome: 'meadow', structure: 'bridge', shot: 11, seed: '-90412288', coords: [-48, 66, 205], version: '1.21', mode: 'Survival', tags: ['bridge', 'medieval'], likes: 515, comments: 34, saves: 88, posted: '5 hours ago', blurb: 'Seven arches and a toll house. Players walk it every day on the server.' },
  { id: 'copper-light', title: 'The Copper Light', author: 'harbormoth', biome: 'coast', structure: 'lighthouse', shot: 5, seed: '77120349', coords: [512, 64, 88], version: '1.20.4', mode: 'Creative', tags: ['lighthouse', 'coast', 'copper'], likes: 1203, comments: 112, saves: 402, posted: 'Yesterday', blurb: 'A weathered copper lighthouse. The lamp room uses the new bulb blocks.' },
  { id: 'dune-hotel', title: 'Dune Pyramid Hotel', author: 'marblerook', biome: 'desert', structure: 'pyramid', shot: 8, seed: '1930044812', coords: [-902, 70, 14], version: '1.21', mode: 'Creative', tags: ['desert', 'hotel', 'interior'], likes: 276, comments: 19, saves: 41, posted: '2 days ago', blurb: 'Sixty rooms inside one pyramid. Every floor has a different theme.' },
  { id: 'snow-cottage', title: 'Snowed-in Cottage with an Unreasonably Long Name to Test Wrapping', author: 'sunkenpine', biome: 'snow', structure: 'cottage', shot: 14, seed: '55820193', coords: [33, 98, -1200], version: '1.19.2', mode: 'Survival', tags: ['cottage', 'snow'], likes: 98, comments: 7, saves: 12, posted: '3 days ago', blurb: 'A tiny cottage with a big chimney. The title is long on purpose: it must wrap, not clip.' },
  { id: 'night-tower', title: 'Night Market Tower', author: 'quillfox', biome: 'night', structure: 'tower', shot: 21, seed: '312009915', coords: [1500, 80, 1500], version: '1.21', mode: 'Creative', tags: ['tower', 'market', 'redstone'], likes: 64, comments: 4, saves: 9, posted: '4 days ago', blurb: 'A market that opens at dusk. The doors and lamps run on a clock.' },
  { id: 'tideline-castle', title: 'Tideline Harbor Castle', author: 'tallowknight', biome: 'coast', structure: 'castle', shot: 17, seed: '8800231', coords: [-210, 63, -640], version: '1.20.4', mode: 'Survival', tags: ['castle', 'harbor'], likes: 331, comments: 28, saves: 57, posted: 'Last week', blurb: 'A harbor castle that floods at high tide. Redstone locks keep the gate closed.' },
  { id: 'meadow-cottage', title: 'Meadow Cottage', author: 'ottercircuit', biome: 'meadow', structure: 'cottage', shot: 2, seed: '99120044', coords: [8, 70, 8], version: '1.21', mode: 'Survival', tags: ['cottage'], likes: 12, comments: 0, saves: 1, posted: 'Last week', blurb: 'My first build I am proud of.' },
]

export const buildById = (id: string): Build => BUILDS.find((b) => b.id === id) ?? BUILDS[0]

export interface CommentItem {
  readonly id: string
  readonly author: string
  readonly text: string
  readonly posted: string
  readonly likes: number
  readonly reply?: boolean
}

export const COMMENTS: readonly CommentItem[] = [
  { id: 'c1', author: 'harbormoth', text: 'The lantern layout on the second tower is perfect. How did you light the underside of the bridge?', posted: '1 hour ago', likes: 24 },
  { id: 'c2', author: 'pebblewren', text: 'Thank you! Chains with lanterns hung below every third plank, so nothing spawns underneath.', posted: '50 minutes ago', likes: 9, reply: true },
  { id: 'c3', author: 'tallowknight', text: 'Saving this for my next castle. Can you share the palette?', posted: '40 minutes ago', likes: 3 },
  { id: 'c4', author: 'sunkenpine', text: 'Is that a survival world? The terraforming around the keep is wild.', posted: '12 minutes ago', likes: 1 },
]

export type ServerMode = 'Survival' | 'Creative' | 'Minigames' | 'Roleplay'
export type ServerRegion = 'EU' | 'NA' | 'Asia' | 'Oceania'

export interface Server {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly version: string
  readonly mode: ServerMode
  readonly region: ServerRegion
  readonly online: number
  readonly max: number
  readonly ping: number | null
  readonly blurb: string
  readonly realm?: boolean
}

export const SERVERS: readonly Server[] = [
  { id: 'mossgate', name: 'Mossgate SMP', address: 'play.mossgate.example', version: '1.21', mode: 'Survival', region: 'EU', online: 84, max: 120, ping: 38, blurb: 'Friendly survival with a build review team and a weekly market.' },
  { id: 'copper-hollow', name: 'Copper Hollow', address: 'copperhollow.example', version: '1.21', mode: 'Creative', region: 'NA', online: 212, max: 300, ping: 112, blurb: 'Plots, WorldEdit and a showcase world voted on every Friday.' },
  { id: 'driftwood', name: 'Driftwood Realm', address: 'DW-4471', version: '1.20.4', mode: 'Roleplay', region: 'EU', online: 11, max: 20, ping: 61, blurb: 'A small realm for a harbor-town story. Applications open.', realm: true },
  { id: 'lantern-lobby', name: 'Lantern Lobby', address: 'lobby.lantern.example', version: '1.21', mode: 'Minigames', region: 'Asia', online: 340, max: 400, ping: 187, blurb: 'Build battles, speed bridging and a parkour tower.' },
  { id: 'tidewater', name: 'Tidewater', address: 'tidewater.example', version: '1.19.2', mode: 'Survival', region: 'Oceania', online: 0, max: 80, ping: null, blurb: 'Down for maintenance. Back this weekend.' },
  { id: 'quarry-guild', name: 'Quarry Guild', address: 'quarry.guild.example', version: '1.21', mode: 'Survival', region: 'NA', online: 120, max: 120, ping: 74, blurb: 'Full right now. The queue moves fast in the evening.' },
]

export interface Group {
  readonly id: string
  readonly name: string
  readonly kind: 'Server' | 'Realm' | 'Guild'
  readonly members: number
  readonly blurb: string
  readonly joined?: boolean
}

export const GROUPS: readonly Group[] = [
  { id: 'g-mossgate', name: 'Mossgate Builders', kind: 'Server', members: 1840, blurb: 'Share builds from the Mossgate SMP and vote on the monthly showcase.', joined: true },
  { id: 'g-driftwood', name: 'Driftwood Harbor', kind: 'Realm', members: 19, blurb: 'Story threads, maps and session notes for the Driftwood realm.' },
  { id: 'g-redstone', name: 'Redstone Guild', kind: 'Guild', members: 5230, blurb: 'Clocks, doors, farms. Post a schematic, get a review.' },
]

export interface Entry {
  readonly build: string
  readonly votes: number
}

export interface Challenge {
  readonly id: string
  readonly week: number
  readonly title: string
  readonly theme: string
  /** hours left when this fixture was written */
  readonly hoursLeft: number
  readonly votesPerPlayer: number
  readonly entries: readonly Entry[]
}

export const CHALLENGE: Challenge = {
  id: 'wk43',
  week: 43,
  title: 'Week 43: Build a Lighthouse',
  theme: 'A tower that guides someone home. Any biome, any size, any version from 1.19 up.',
  hoursLeft: 62,
  votesPerPlayer: 3,
  entries: [
    { build: 'copper-light', votes: 412 },
    { build: 'night-tower', votes: 118 },
    { build: 'tideline-castle', votes: 203 },
    { build: 'lantern-keep', votes: 377 },
  ],
}

export interface CalendarEvent {
  readonly id: string
  readonly day: number
  readonly time: string
  readonly title: string
  readonly kind: 'Challenge' | 'Showcase' | 'Meetup' | 'Maintenance'
  readonly place: string
  readonly going: number
}

/** October 2026 starts on a Thursday and has 31 days. */
export const MONTH = { label: 'October 2026', startsOn: 3, days: 31, today: 24 } as const

export const EVENTS: readonly CalendarEvent[] = [
  { id: 'e1', day: 24, time: '18:00', title: 'Lighthouse voting closes', kind: 'Challenge', place: 'Blockfeed', going: 214 },
  { id: 'e2', day: 24, time: '20:00', title: 'Mossgate build night', kind: 'Meetup', place: 'Mossgate SMP', going: 38 },
  { id: 'e3', day: 27, time: '19:30', title: 'Showcase: castles of the month', kind: 'Showcase', place: 'Blockfeed', going: 96 },
  { id: 'e4', day: 31, time: '21:00', title: 'Haunted builds party', kind: 'Meetup', place: 'Copper Hollow', going: 152 },
  { id: 'e5', day: 28, time: '03:00', title: 'Tidewater maintenance', kind: 'Maintenance', place: 'Tidewater', going: 0 },
  { id: 'e6', day: 3, time: '17:00', title: 'Week 44 challenge opens', kind: 'Challenge', place: 'Blockfeed', going: 0 },
]

export interface Notification {
  readonly id: string
  readonly kind: 'like' | 'comment' | 'follow' | 'challenge' | 'event' | 'mention'
  readonly who?: string
  readonly text: string
  readonly target?: string
  readonly when: string
  readonly unread: boolean
}

export const NOTIFICATIONS: readonly Notification[] = [
  { id: 'n1', kind: 'comment', who: 'harbormoth', text: 'commented on', target: 'Night Market Tower', when: '4 min ago', unread: true },
  { id: 'n2', kind: 'like', who: 'pebblewren', text: 'and 41 others liked', target: 'Night Market Tower', when: '1 hour ago', unread: true },
  { id: 'n3', kind: 'follow', who: 'tallowknight', text: 'started following you', when: '3 hours ago', unread: true },
  { id: 'n4', kind: 'challenge', text: 'Voting for Week 43 closes in 2 days. You have 3 votes left.', when: 'Yesterday', unread: false },
  { id: 'n5', kind: 'mention', who: 'birchlantern', text: 'mentioned you in', target: 'Mossgate Builders', when: 'Yesterday', unread: false },
  { id: 'n6', kind: 'event', text: 'Mossgate build night starts tonight at 20:00.', when: '2 days ago', unread: false },
]

export interface Message {
  readonly from: string
  readonly text: string
  readonly at: string
}

export interface Thread {
  readonly id: string
  readonly with: string
  readonly unread: number
  readonly messages: readonly Message[]
}

export const THREADS: readonly Thread[] = [
  {
    id: 't1',
    with: 'harbormoth',
    unread: 2,
    messages: [
      { from: 'harbormoth', at: '19:02', text: 'Your night market is gorgeous. Would you build the lamp clock for my harbor?' },
      { from: 'quillfox', at: '19:05', text: 'Thanks! Sure, send me the coordinates and I will take a look.' },
      { from: 'harbormoth', at: '19:06', text: 'X 512, Y 64, Z 88. The old lighthouse.' },
      { from: 'harbormoth', at: '19:06', text: 'Bring a few spare redstone repeaters.' },
    ],
  },
  { id: 't2', with: 'tallowknight', unread: 0, messages: [{ from: 'tallowknight', at: 'Mon', text: 'Which version did you use for the castle palette?' }] },
  { id: 't3', with: 'birchlantern', unread: 0, messages: [{ from: 'birchlantern', at: 'Sun', text: 'Reminder: no personal info in build descriptions, please.' }] },
]

export type ReportReason = 'Spam or scam' | 'Harassment' | 'Stolen build' | 'Unsafe link' | 'Something else'

export interface Report {
  readonly id: string
  readonly kind: 'Comment' | 'Build' | 'Message'
  readonly target: string
  readonly excerpt: string
  readonly reason: ReportReason
  readonly by: string
  readonly when: string
  readonly count: number
}

export const REPORTS: readonly Report[] = [
  { id: 'r1', kind: 'Comment', target: 'Night Market Tower', excerpt: 'Join my server for free ranks!! click the link in my profile', reason: 'Spam or scam', by: 'harbormoth', when: '10 min ago', count: 6 },
  { id: 'r2', kind: 'Build', target: 'Dune Pyramid Hotel', excerpt: 'This is the same hotel as the one on another site. Same coordinates, same seed.', reason: 'Stolen build', by: 'sunkenpine', when: '1 hour ago', count: 2 },
  { id: 'r3', kind: 'Comment', target: 'Mossgate Bridge', excerpt: 'Nobody asked and your bridge is mid.', reason: 'Harassment', by: 'tallowknight', when: '3 hours ago', count: 1 },
]
