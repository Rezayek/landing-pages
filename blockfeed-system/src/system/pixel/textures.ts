/**
 * Procedural pixel art: the backdrop tiles, the avatar faces, the build "screenshots" and the XP orb. All of it is
 * drawn here from a seed, in Blockfeed's own palettes, so the playground has pictures without borrowing any: the same
 * name always draws the same face and the same seed always draws the same landscape.
 */
import { hashString, rng } from './art'

const clamp = (v: number): number => Math.max(0, Math.min(255, Math.round(v)))

function shade(hex: string, delta: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = clamp((n >> 16) + delta)
  const g = clamp(((n >> 8) & 255) + delta)
  const b = clamp((n & 255) + delta)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function canvas(w: number, h: number): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  // no 2D canvas (blocked or unsupported): draw nothing instead of throwing, so the page still renders; the picture
  // comes out empty ("data:,") and its alt text and captions carry it
  return { c, x: c.getContext('2d') ?? NO_DRAW }
}
const NO_DRAW = new Proxy({} as CanvasRenderingContext2D, { get: () => () => undefined, set: () => true })

// ---------------------------------------------------------------------------------------------------------------
// Backdrop tiles: a 32 x 32 noise of two or three close tones with short horizontal clumps, like worn stone
// ---------------------------------------------------------------------------------------------------------------
export function backdropTile(base: string, seed = 7): string {
  const { c, x } = canvas(32, 32)
  const next = rng(seed)
  x.fillStyle = base
  x.fillRect(0, 0, 32, 32)
  for (let i = 0; i < 150; i++) {
    const w = 1 + Math.floor(next() * 3)
    x.fillStyle = shade(base, next() < 0.5 ? -7 : 7)
    x.fillRect(Math.floor(next() * 32), Math.floor(next() * 32), w, 1)
  }
  return c.toDataURL()
}

/** Sets the two backdrop tiles as custom properties; tokens.css picks one per theme. */
export function applyTextures(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--tex-stone', `url(${backdropTile('#2e3033')})`)
  root.style.setProperty('--tex-deepslate', `url(${backdropTile('#17181a', 11)})`)
}

// ---------------------------------------------------------------------------------------------------------------
// Avatars: an 8 x 8 face from a name. Four hair styles, six skin tones, glasses, a beard, three mouths.
// ---------------------------------------------------------------------------------------------------------------
const SKIN = ['#f1c9a5', '#d9a574', '#b57a4b', '#8a5530', '#5e3920', '#f7d9c2']
const HAIR = ['#1d1a18', '#5a3a1e', '#b8651b', '#e0b43a', '#c8c8c8', '#7a3fc0', '#1f9a6c', '#c23d6b']
const BAND = ['#c23d3d', '#3a5fd0', '#e0b43a', '#2f9e62']

const HEADS: readonly (readonly string[])[] = [
  ['hhhhhhhh', 'hhhhhhhh', 'hssssssh', 'ssessess', 'ssssssss', 'ssssssss', 'ssssssss', 'ssssssss'],
  ['hhhhhhhh', 'hhhhhhhh', 'hhhsssss', 'hsessess', 'ssssssss', 'ssssssss', 'ssssssss', 'ssssssss'],
  ['hhhhhhhh', 'hhhhhhhh', 'hssssssh', 'hsessesh', 'hssssssh', 'hssssssh', 'hssssssh', 'hhsssshh'],
  ['cccccccc', 'cccccccc', 'bbbbbbbb', 'ssessess', 'ssssssss', 'ssssssss', 'ssssssss', 'ssssssss'],
]

export interface AvatarArt {
  readonly rows: readonly string[]
  readonly colors: Readonly<Record<string, string>>
}

const avatarCache = new Map<string, AvatarArt>()

export function avatarArt(name: string): AvatarArt {
  const hit = avatarCache.get(name)
  if (hit) return hit
  const next = rng(hashString(name))
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)]
  const rows = pick(HEADS).map((row) => row.split(''))
  const mouth = Math.floor(next() * 3)
  const set = (r: number, c: number, ch: string): void => {
    if (rows[r]?.[c] !== undefined) rows[r][c] = ch
  }
  if (mouth === 0) {
    set(5, 3, 'm')
    set(5, 4, 'm')
  } else if (mouth === 1) {
    set(5, 2, 'm')
    set(5, 5, 'm')
    set(6, 3, 'm')
    set(6, 4, 'm')
  } else {
    set(5, 3, 'm')
    set(5, 4, 'm')
    set(6, 3, 'm')
    set(6, 4, 'm')
  }
  if (next() < 0.28) for (const c of [1, 2, 3, 4, 5, 6]) if (rows[3][c] === 's') set(3, c, 'g')
  if (next() < 0.25) for (const r of [6, 7]) for (let c = 1; c < 7; c++) if (rows[r][c] === 's') set(r, c, 'b')
  // a shade along the bottom and right edge gives the head its block
  for (let c = 0; c < 8; c++) if (rows[7][c] === 's') set(7, c, 'd')
  for (let r = 0; r < 8; r++) if (rows[r][7] === 's') set(r, 7, 'd')
  const hair = pick(HAIR)
  const skin = pick(SKIN)
  const art: AvatarArt = {
    rows: rows.map((r) => r.join('')),
    colors: {
      h: hair,
      c: pick(BAND),
      b: next() < 0.5 ? shade(hair, -10) : pick(BAND),
      s: skin,
      d: shade(skin, -28),
      e: '#1d2a44',
      m: shade(skin, -70),
      g: '#2b2d30',
    },
  }
  avatarCache.set(name, art)
  return art
}

// ---------------------------------------------------------------------------------------------------------------
// Build "screenshots": a 64 x 36 landscape with one structure on it, from a seed and a biome
// ---------------------------------------------------------------------------------------------------------------
export type Biome = 'meadow' | 'desert' | 'snow' | 'dusk' | 'night' | 'coast'
export type Structure = 'tower' | 'cottage' | 'castle' | 'bridge' | 'lighthouse' | 'pyramid'

interface Look {
  sky: readonly string[]
  sun: string
  far: string
  near: string
  ground: string
  soil: string
  wall: string
  wallShade: string
  roof: string
  wood: string
  water?: string
}

const LOOKS: Record<Biome, Look> = {
  meadow: { sky: ['#6fb8ea', '#8cc9f0', '#acdaf5', '#cbe8f8'], sun: '#fff0a8', far: '#6fa38a', near: '#4f9a52', ground: '#3f8444', soil: '#7a5434', wall: '#b9bcc2', wallShade: '#8d9096', roof: '#b34a3c', wood: '#9a6a3a' },
  desert: { sky: ['#e9a46a', '#f0b97f', '#f6cf96', '#fbe3b4'], sun: '#fff6c8', far: '#d49a62', near: '#e0b574', ground: '#e6c786', soil: '#c79a56', wall: '#ecd49a', wallShade: '#c9a863', roof: '#a8623a', wood: '#8a5a32' },
  snow: { sky: ['#9ab8d8', '#b4cde6', '#cfe0f0', '#e6f0f8'], sun: '#ffffff', far: '#b9ccdc', near: '#dfe9f2', ground: '#f2f6fa', soil: '#c3cfda', wall: '#c8ced6', wallShade: '#98a3af', roof: '#5a6f8a', wood: '#7a5a3c' },
  dusk: { sky: ['#4a2f7a', '#8a3f86', '#d4607a', '#f3a06a'], sun: '#ffd68a', far: '#5a3a74', near: '#3c2a52', ground: '#2c2040', soil: '#201733', wall: '#8d86a8', wallShade: '#625b80', roof: '#c25a4a', wood: '#7a4a3a' },
  night: { sky: ['#0b1230', '#121c44', '#1b2a5a', '#243670'], sun: '#e8edf8', far: '#1d3a52', near: '#18382f', ground: '#122a24', soil: '#0c1c18', wall: '#8890a8', wallShade: '#5a6280', roof: '#7a3a4a', wood: '#5a4030' },
  coast: { sky: ['#5ec0e8', '#7fd0ee', '#a6e0f4', '#c9eefa'], sun: '#fff7b8', far: '#6aa8a0', near: '#d6c690', ground: '#e4d6a0', soil: '#bba878', wall: '#e8ecf0', wallShade: '#b4bcc6', roof: '#c8483c', wood: '#8a6238', water: '#2f86b8' },
}

const BIOMES = Object.keys(LOOKS) as Biome[]
const STRUCTURES: Structure[] = ['tower', 'cottage', 'castle', 'bridge', 'lighthouse', 'pyramid']
const shotCache = new Map<string, string>()

export function buildShot(seed: number, biome?: Biome, structure?: Structure): string {
  const key = `${seed}:${biome ?? ''}:${structure ?? ''}`
  const hit = shotCache.get(key)
  if (hit) return hit
  const next = rng(seed * 7919 + 13)
  const b = biome ?? BIOMES[Math.floor(next() * BIOMES.length)]
  const s = structure ?? STRUCTURES[Math.floor(next() * STRUCTURES.length)]
  const look = LOOKS[b]
  const W = 64
  const H = 36
  const gy = 25
  const { c, x } = canvas(W, H)
  const box = (px: number, py: number, w: number, h: number, color: string): void => {
    x.fillStyle = color
    x.fillRect(Math.round(px), Math.round(py), w, h)
  }
  look.sky.forEach((color, i) => box(0, i * 7, W, 7, color))
  if (b === 'night') for (let i = 0; i < 26; i++) box(next() * W, next() * 16, 1, 1, i % 4 === 0 ? '#ffffff' : '#9aa6d0')
  const sx = 8 + next() * 48
  const sy = 4 + next() * 8
  for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (xx * xx + yy * yy <= 9) box(sx + xx, sy + yy, 1, 1, look.sun)
  if (b !== 'night') for (let i = 0; i < 3; i++) {
    const cx = next() * 56
    const cy = 3 + next() * 12
    box(cx, cy, 8, 2, '#ffffff')
    box(cx + 2, cy - 1, 4, 1, '#ffffff')
    box(cx + 1, cy + 2, 5, 1, shade('#ffffff', -22))
  }
  const p1 = next() * 6
  const p2 = next() * 6
  for (let xx = 0; xx < W; xx++) {
    const far = Math.round(6 + 3 * Math.sin(xx * 0.11 + p1) + 2 * Math.sin(xx * 0.29 + p2))
    box(xx, gy - far, 1, far + 1, look.far)
    const near = Math.round(2 + 2 * Math.sin(xx * 0.17 + p2) + Math.sin(xx * 0.4 + p1))
    box(xx, gy - near, 1, near + 1, look.near)
  }
  box(0, gy + 1, W, H - gy - 1, look.ground)
  if (look.water) {
    box(0, gy + 1, W, H - gy - 1, look.water)
    for (let i = 0; i < 18; i++) box(next() * W, gy + 2 + next() * 8, 3, 1, shade(look.water, 22))
    box(18, gy - 1, 30, 6, look.ground)
    box(16, gy + 1, 34, 3, look.ground)
  } else {
    box(0, gy + 6, W, H, look.soil)
    for (let i = 0; i < 90; i++) box(next() * W, gy + 1 + next() * (H - gy - 1), 1, 1, shade(next() < 0.5 ? look.ground : look.soil, next() < 0.5 ? -14 : 12))
  }
  const cx = 22 + Math.floor(next() * 18)
  draw(s, cx, gy, look, box)
  for (let i = 0; i < 4; i++) {
    const tx = Math.floor(next() * W)
    if (Math.abs(tx - cx) < 12) continue
    if (b === 'desert') {
      box(tx, gy - 4, 1, 5, '#4f7a3a')
      box(tx - 1, gy - 3, 1, 2, '#4f7a3a')
    } else {
      box(tx, gy - 3, 1, 4, look.wood)
      box(tx - 2, gy - 6, 5, 3, shade(look.near, -22))
      box(tx - 1, gy - 8, 3, 2, shade(look.near, -22))
    }
  }
  const url = c.toDataURL()
  shotCache.set(key, url)
  return url
}

type Box = (px: number, py: number, w: number, h: number, color: string) => void

function draw(s: Structure, cx: number, gy: number, look: Look, box: Box): void {
  const { wall, wallShade, roof, wood } = look
  if (s === 'tower') {
    box(cx - 3, gy - 18, 7, 19, wall)
    box(cx + 2, gy - 18, 2, 19, wallShade)
    for (let i = 0; i < 4; i++) box(cx - 3 + i * 2, gy - 20, 1, 2, wall)
    box(cx - 1, gy - 12, 2, 3, '#1c1d20')
    box(cx - 1, gy - 3, 2, 4, wood)
  } else if (s === 'cottage') {
    box(cx - 6, gy - 8, 13, 9, wall)
    box(cx + 4, gy - 8, 3, 9, wallShade)
    for (let i = 0; i < 6; i++) box(cx - 7 + i, gy - 9 - i, 15 - i * 2, 1, roof)
    box(cx - 1, gy - 5, 3, 6, wood)
    box(cx - 5, gy - 6, 2, 2, '#f6e08a')
    box(cx + 3, gy - 6, 2, 2, '#f6e08a')
  } else if (s === 'castle') {
    box(cx - 12, gy - 9, 25, 10, wall)
    box(cx + 8, gy - 9, 5, 10, wallShade)
    for (const t of [-14, -1, 11]) {
      box(cx + t, gy - 15, 5, 16, wall)
      box(cx + t + 3, gy - 15, 2, 16, wallShade)
      for (let i = 0; i < 3; i++) box(cx + t + i * 2, gy - 17, 1, 2, wall)
      box(cx + t + 2, gy - 11, 1, 3, '#1c1d20')
    }
    box(cx - 2, gy - 6, 4, 7, wood)
  } else if (s === 'bridge') {
    box(cx - 16, gy - 5, 33, 2, wood)
    box(cx - 16, gy - 3, 3, 4, wall)
    box(cx + 14, gy - 3, 3, 4, wall)
    for (let i = 0; i < 9; i++) box(cx - 14 + i * 4, gy - 8, 1, 3, wood)
    box(cx - 16, gy - 8, 33, 1, wood)
    for (let i = -6; i <= 6; i++) box(cx + i, gy - 3 + Math.floor((i * i) / 12), 1, 1, wallShade)
  } else if (s === 'lighthouse') {
    for (let i = 0; i < 6; i++) box(cx - 3 + Math.floor(i / 3), gy - 3 - i * 3, 7 - Math.floor(i / 3) * 2, 3, i % 2 ? '#c8483c' : '#f2f4f6')
    box(cx - 3, gy - 24, 7, 2, '#2b2d30')
    box(cx - 2, gy - 26, 5, 2, '#f6e08a')
    box(cx - 1, gy - 28, 3, 2, roof)
  } else {
    for (let i = 0; i < 12; i++) box(cx - 12 + i, gy - i, 25 - i * 2, 1, i % 4 === 3 ? wallShade : wall)
    box(cx - 1, gy - 4, 3, 5, '#1c1d20')
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The XP orb: a 6 x 6 glowing seed that flies to the bar
// ---------------------------------------------------------------------------------------------------------------
export const ORB = {
  rows: ['..zz..', '.zyYz.', 'zyYYyz', 'zyYyyz', '.zyyz.', '..zz..'],
  colors: { z: '#2f6d12', y: '#7fe03a', Y: '#d8ff8a' },
} as const
