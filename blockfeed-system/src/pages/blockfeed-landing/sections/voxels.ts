/**
 * The hero plot's voxel builds and a tiny isometric renderer (Canvas 2D, no engine). Cubes are drawn back to front as
 * three flat faces, snapped to whole pixels, so the plot stays crisp pixel art. Colours are page tokens (tokens.css),
 * read at draw time, so the canvas never holds a raw value.
 */
import type { Structure } from '@/system/pixel/textures'

export type Block = 'grass' | 'dirt' | 'stone' | 'plank' | 'glass' | 'lamp' | 'roof' | 'sand' | 'water' | 'leaf' | 'log' | 'flower' | 'poppy' | 'tallgrass'

export interface Voxel {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly b: Block
}

const PLOT = 8

function plot(ground: Block = 'grass'): Voxel[] {
  const v: Voxel[] = []
  for (let x = 0; x < PLOT; x++) for (let z = 0; z < PLOT; z++) v.push({ x, y: 0, z, b: (x * 3 + z * 5) % 11 === 4 ? 'dirt' : ground })
  return v
}

function ring(v: Voxel[], y: number, a: number, b: number, block: Block | ((x: number, z: number) => Block)): void {
  for (let x = a; x <= b; x++)
    for (let z = a; z <= b; z++) {
      if (x !== a && x !== b && z !== a && z !== b) continue
      v.push({ x, y, z, b: typeof block === 'function' ? block(x, z) : block })
    }
}

function fill(v: Voxel[], y: number, a: number, b: number, block: Block): void {
  for (let x = a; x <= b; x++) for (let z = a; z <= b; z++) v.push({ x, y, z, b: block })
}

/** The hero build: a lighthouse; listed bottom layer first so it assembles upwards, the lamp's roof last. */
function lighthouse(): Voxel[] {
  const v = plot()
  for (let y = 1; y <= 7; y++) ring(v, y, 2, 5, y >= 6 ? 'glass' : y % 3 === 0 ? 'roof' : 'stone')
  fill(v, 7, 3, 4, 'lamp')
  fill(v, 8, 2, 5, 'roof')
  v.push({ x: 0, y: 1, z: 6, b: 'plank' }, { x: 1, y: 1, z: 6, b: 'plank' }, { x: 0, y: 1, z: 7, b: 'plank' })
  fill(v, 9, 3, 4, 'roof')
  return v
}

function tower(): Voxel[] {
  const v = plot()
  for (let y = 1; y <= 9; y++) ring(v, y, 2, 5, y % 4 === 0 ? 'glass' : 'stone')
  ring(v, 10, 1, 6, (x, z) => ((x + z) % 2 ? 'stone' : 'plank'))
  fill(v, 11, 3, 4, 'lamp')
  return v
}

function castle(): Voxel[] {
  const v = plot()
  for (let y = 1; y <= 3; y++) ring(v, y, 0, 7, (x, z) => (y === 2 && (x === 3 || x === 4) && z === 7 ? 'plank' : 'stone'))
  ring(v, 4, 0, 7, (x, z) => ((x + z) % 2 ? 'stone' : 'roof'))
  for (let y = 4; y <= 6; y++) ring(v, y, 2, 5, y === 6 ? 'roof' : 'stone')
  fill(v, 7, 3, 4, 'lamp')
  return v
}

function cottage(): Voxel[] {
  const v = plot()
  for (let y = 1; y <= 3; y++) ring(v, y, 1, 6, (x, z) => (y === 2 && (x === 3 || z === 3) ? 'glass' : 'plank'))
  for (let y = 4; y <= 6; y++) fill(v, y, y - 3, 7 - (y - 3), 'roof')
  return v
}

function bridge(): Voxel[] {
  const v: Voxel[] = []
  for (let x = 0; x < PLOT; x++) for (let z = 0; z < PLOT; z++) if (x < 2 || x > 5) v.push({ x, y: 0, z, b: 'grass' })
  for (let z = 0; z < PLOT; z++) for (let x = 0; x < PLOT; x++) if (z >= 3 && z <= 4) v.push({ x, y: 2, z, b: 'plank' })
  for (let x = 0; x < PLOT; x += 2) {
    v.push({ x, y: 3, z: 2, b: 'stone' }, { x, y: 3, z: 5, b: 'stone' })
    if (x % 4 === 0) v.push({ x, y: 4, z: 2, b: 'lamp' }, { x, y: 4, z: 5, b: 'lamp' })
  }
  return v
}

function pyramid(): Voxel[] {
  const v = plot('sand')
  for (let y = 1; y <= 4; y++) fill(v, y, y - 1, PLOT - y, 'sand')
  fill(v, 5, 3, 4, 'lamp')
  return v
}

const MODELS: Record<Structure, () => Voxel[]> = { lighthouse, tower, castle, cottage, bridge, pyramid }

export function modelFor(structure: Structure): Voxel[] {
  return MODELS[structure]()
}

type Faces = readonly [string, string, string]

/** The block palette from the page tokens, read once per draw. */
export function readPalette(el: Element): Record<Block, Faces> {
  const s = getComputedStyle(el)
  const f = (n: string): Faces => [s.getPropertyValue(`--bl-${n}-1`).trim(), s.getPropertyValue(`--bl-${n}-2`).trim(), s.getPropertyValue(`--bl-${n}-3`).trim()]
  return { grass: f('grass'), dirt: f('dirt'), stone: f('stone'), plank: f('plank'), glass: f('glass'), lamp: f('lamp'), roof: f('roof'), sand: f('sand'), water: f('water'), leaf: f('leaf'), log: f('log'), flower: f('lamp'), poppy: f('roof'), tallgrass: f('grass') }
}

/** The canvas size a model needs at cube size `u` (half-width of a top face), with room above for tall builds. */
export function canvasSize(u: number): { w: number; h: number; ox: number; oy: number } {
  const w = PLOT * 2 * u + 2 * u
  const h = PLOT * u + 13 * u
  return { w, h, ox: Math.round(w / 2), oy: Math.round(11 * u) }
}

/** Draws the first `count` voxels of `voxels` (in list order), painted back to front. */
export function draw(
  ctx: CanvasRenderingContext2D,
  voxels: readonly Voxel[],
  count: number,
  palette: Record<Block, Faces>,
  u: number,
  ox: number,
  oy: number,
): void {
  const shown = voxels.slice(0, count).sort((a, b) => a.x + a.z - (b.x + b.z) || a.y - b.y || a.x - b.x)
  for (const { x, y, z, b } of shown) {
    const [top, left, right] = palette[b]
    const sx = Math.round(ox + (x - z) * u)
    const sy = Math.round(oy + (x + z) * (u / 2) - y * u)
    poly(ctx, top, [sx, sy, sx + u, sy + u / 2, sx, sy + u, sx - u, sy + u / 2])
    poly(ctx, left, [sx - u, sy + u / 2, sx, sy + u, sx, sy + 2 * u, sx - u, sy + u / 2 + u])
    poly(ctx, right, [sx + u, sy + u / 2, sx, sy + u, sx, sy + 2 * u, sx + u, sy + u / 2 + u])
  }
}

function poly(ctx: CanvasRenderingContext2D, fill: string, p: readonly number[]): void {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(p[0], p[1])
  for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1])
  ctx.closePath()
  ctx.fill()
}

/* ----- the world around the plot ---------------------------------------------------------------------------------- */

/** A small seeded random generator, so the world is the same on every visit (the seed in the HUD). */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

export const WORLD = 40
/** Where the build's 8×8 plot sits in the world (its back corner). In front of it the ground stays flat, so the
 *  terrain can be drawn once and the build painted over it. */
export const PLOT_AT = { x: 16, z: 15 } as const

/** The world around the plot: hills at the back, a beach and water in front, a few trees. Static, seeded. */
export function terrain(seed = 0x7f3a29): Voxel[] {
  const r = rng(seed)
  const v: Voxel[] = []
  const inPlot = (x: number, z: number): boolean => x >= PLOT_AT.x && x < PLOT_AT.x + 8 && z >= PLOT_AT.z && z < PLOT_AT.z + 8
  const front = (x: number, z: number): boolean => x + z > PLOT_AT.x + PLOT_AT.z + 8
  const isWater = (x: number, z: number): boolean => x + z > 60 || (x > 28 && z > 23) || (z > 32 && x > 6) || (x > 34 && z > 12)
  const isSand = (x: number, z: number): boolean => !isWater(x, z) && (isWater(x + 1, z) || isWater(x, z + 1) || isWater(x + 1, z + 1) || isWater(x + 2, z) || isWater(x, z + 2))
  const heights: number[][] = []
  for (let x = 0; x < WORLD; x++) {
    heights[x] = []
    for (let z = 0; z < WORLD; z++) {
      let h = 1
      if (!front(x, z) && !inPlot(x, z)) h = 1 + Math.max(0, Math.floor((26 - (x + z) / 2) / 3 + (r() - 0.5) * 1.6))
      heights[x][z] = Math.min(h, 9)
    }
  }
  for (let x = 0; x < WORLD; x++)
    for (let z = 0; z < WORLD; z++) {
      if (inPlot(x, z)) continue
      if (isWater(x, z)) {
        v.push({ x, y: 0, z, b: 'water' })
        continue
      }
      const h = heights[x][z]
      for (let y = 0; y < h; y++) {
        const top = y === h - 1
        v.push({ x, y, z, b: isSand(x, z) ? 'sand' : top ? 'grass' : y < h - 2 ? 'stone' : 'dirt' })
      }
    }
  // flowers and tall grass on grass tops behind the plot (sprites, never in front of it)
  for (let x = 0; x < WORLD; x++)
    for (let z = 0; z < WORLD; z++) {
      if (inPlot(x, z) || front(x, z) || isWater(x, z) || isSand(x, z)) continue
      const roll = r()
      if (roll > 0.22) continue
      v.push({ x, y: heights[x][z], z, b: roll < 0.04 ? 'poppy' : roll < 0.08 ? 'flower' : 'tallgrass' })
    }
  // trees on the grass behind the plot (never in front of it)
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * (WORLD - 4)) + 1
    const z = Math.floor(r() * (WORLD - 4)) + 1
    if (inPlot(x, z) || front(x, z) || isWater(x, z) || isSand(x, z)) continue
    if (Math.abs(x - PLOT_AT.x - 4) + Math.abs(z - PLOT_AT.z - 4) < 7) continue
    const h = heights[x][z]
    for (let y = h; y < h + 3; y++) v.push({ x, y, z, b: 'log' })
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) v.push({ x: x + dx, y: h + 2, z: z + dz, b: 'leaf' })
    v.push({ x, y: h + 3, z, b: 'leaf' })
  }
  return v
}

/** Mixes two #rrggbb colours: t = 0 gives a, 1 gives b. */
function mix(a: string, b: string, t: number): string {
  const p = (c: string, i: number): number => Number.parseInt(c.slice(1 + i * 2, 3 + i * 2), 16)
  const ch = (i: number): string => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0')
  return `#${ch(0)}${ch(1)}${ch(2)}`
}

/**
 * The night sky: twelve fine steps from deep night at the top to the lighter horizon (no hard band edge), square stars
 * kept clear of the HUD corners, a moon with crater pixels, and flat blocky clouds lit by the moon.
 */
export function drawSky(ctx: CanvasRenderingContext2D, el: Element, w: number, h: number, u: number): void {
  const s = getComputedStyle(el)
  const top = s.getPropertyValue('--bl-sky-1').trim()
  const mid = s.getPropertyValue('--bl-sky-2').trim()
  const low = s.getPropertyValue('--bl-sky-3').trim()
  const steps = 12
  const bandH = Math.ceil(h / steps / 2) * 2
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    ctx.fillStyle = t < 0.5 ? mix(top, mid, t * 2) : mix(mid, low, (t - 0.5) * 2)
    ctx.fillRect(0, i * bandH, w, bandH + 1)
  }
  const r = rng(43)
  const star = s.getPropertyValue('--bl-star').trim()
  ctx.fillStyle = star
  for (let i = 0; i < 70; i++) {
    const size = r() < 0.2 ? Math.max(2, Math.round(u / 5) * 2) : Math.max(2, Math.round(u / 8) * 2)
    const sx = Math.round((r() * w) / 2) * 2
    const sy = Math.round((r() * h * 0.45) / 2) * 2
    if (sy < h * 0.2 && (sx < w * 0.2 || sx > w * 0.8)) continue
    ctx.fillRect(sx, sy, size, size)
  }
  // the moon: a square with three darker crater pixels
  const m = Math.max(16, Math.round(u * 2.4))
  const mx = Math.round(w * 0.36)
  const my = Math.round(h * 0.035)
  ctx.fillStyle = s.getPropertyValue('--bl-moon').trim()
  ctx.fillRect(mx, my, m, m)
  ctx.fillStyle = mix(s.getPropertyValue('--bl-moon').trim(), mid, 0.35)
  const c = Math.round(m / 6)
  ctx.fillRect(mx + c, my + c * 2, c * 2, c)
  ctx.fillRect(mx + c * 3, my + c * 4, c, c)
  ctx.fillRect(mx + c * 4, my + c, c, c)
  // clouds: flat blocky slabs, lit on top by the moon
  const cloud = mix(low, star, 0.18)
  const cloudTop = mix(low, star, 0.3)
  for (let i = 0; i < 6; i++) {
    const cw = Math.round((u * (6 + r() * 8)) / 2) * 2
    const cx = Math.round((r() * (w + cw)) - cw / 2)
    const cy = Math.round(h * (0.06 + r() * 0.24))
    const ch = Math.round(u * 0.9)
    ctx.fillStyle = cloud
    ctx.fillRect(cx, cy, cw, ch)
    ctx.fillRect(cx + Math.round(cw * 0.2), cy - ch, Math.round(cw * 0.45), ch)
    ctx.fillStyle = cloudTop
    ctx.fillRect(cx + Math.round(cw * 0.2), cy - ch, Math.round(cw * 0.45), Math.max(2, Math.round(u / 6)))
    ctx.fillRect(cx, cy, Math.round(cw * 0.2), Math.max(2, Math.round(u / 6)))
  }
}

/* ----- editing the world: column heights, picking a column under the pointer, the selection frame ------------------- */

/** The top of every column (one more than its highest block), plants included. */
export function heightMap(voxels: readonly Voxel[]): number[][] {
  const h = Array.from({ length: WORLD }, () => new Array<number>(WORLD).fill(0))
  for (const { x, y, z } of voxels) if (x >= 0 && z >= 0 && x < WORLD && z < WORLD) h[x][z] = Math.max(h[x][z], y + 1)
  return h
}

/** The column whose top face is under (px, py), front columns first (they cover the ones behind). */
export function pick(px: number, py: number, heights: number[][], u: number, ox: number, oy: number): { x: number; z: number } | null {
  let best: { x: number; z: number; d: number } | null = null
  for (let x = 0; x < WORLD; x++)
    for (let z = 0; z < WORLD; z++) {
      const top = heights[x][z] - 1
      if (top < 0) continue
      const cx = ox + (x - z) * u
      const cy = oy + (x + z) * (u / 2) - top * u + u / 2
      if (Math.abs(px - cx) / u + Math.abs(py - cy) / (u / 2) > 1) continue
      const d = x + z + top
      if (!best || d > best.d) best = { x, z, d }
    }
  return best ? { x: best.x, z: best.z } : null
}

/** The white selection frame around a column's top block (the game's cursor over a block). */
export function drawSelection(ctx: CanvasRenderingContext2D, colour: string, x: number, y: number, z: number, u: number, ox: number, oy: number, ratio: number): void {
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  const sx = Math.round(ox + (x - z) * u)
  const sy = Math.round(oy + (x + z) * (u / 2) - y * u)
  ctx.strokeStyle = colour
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(sx + u, sy + u / 2)
  ctx.lineTo(sx + u, sy + u / 2 + u)
  ctx.lineTo(sx, sy + 2 * u)
  ctx.lineTo(sx - u, sy + u / 2 + u)
  ctx.lineTo(sx - u, sy + u / 2)
  ctx.closePath()
  ctx.moveTo(sx - u, sy + u / 2)
  ctx.lineTo(sx, sy + u)
  ctx.lineTo(sx + u, sy + u / 2)
  ctx.moveTo(sx, sy + u)
  ctx.lineTo(sx, sy + 2 * u)
  ctx.stroke()
}

/* ----- block textures: 16×16 pixel faces, drawn in code, mapped onto each face --------------------------------------- */

const T = 16

export interface FaceTextures {
  readonly top: HTMLCanvasElement
  readonly side: HTMLCanvasElement
}

function canvas16(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = T
  c.height = T
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  return [c, ctx]
}

/** Fills every texel from a weighted pick of tones, then lets `extra` paint details on top. */
function texture(seed: number, tones: readonly string[], extra?: (px: (x: number, y: number, c: string) => void, r: () => number) => void): HTMLCanvasElement {
  const [c, ctx] = canvas16()
  const r = rng(seed)
  const px = (x: number, y: number, col: string): void => {
    ctx.fillStyle = col
    ctx.fillRect(x, y, 1, 1)
  }
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) px(x, y, tones[Math.floor(r() * tones.length)])
  extra?.(px, r)
  return c
}

/** Every block's top and side texture, from the page tokens (palette faces: light, mid, dark). */
export function makeTextures(p: Record<Block, Faces>): Record<Block, FaceTextures> {
  const [g1, g2, g3] = p.grass
  const [d1, d2, d3] = p.dirt
  const [s1, s2, s3] = p.stone
  const dirt = texture(3, [d2, d2, d1, d3], (px, r) => {
    for (let i = 0; i < 6; i++) px(Math.floor(r() * T), Math.floor(r() * T), s2) // pebbles
  })
  const grassSide = texture(5, [d2, d2, d1, d3], (px, r) => {
    for (let x = 0; x < T; x++) {
      const depth = 2 + Math.floor(r() * 3) // the green fringe hangs 2-4 texels down
      for (let y = 0; y < depth; y++) px(x, y, y === depth - 1 ? g3 : r() < 0.5 ? g2 : g1)
    }
  })
  const grassTop = texture(7, [g1, g2, g2, g1, g3])
  const stone = texture(11, [s2, s2, s1, s3], (px, r) => {
    for (let i = 0; i < 4; i++) {
      let x = Math.floor(r() * T)
      let y = Math.floor(r() * T)
      for (let k = 0; k < 4; k++) {
        px(x, y, s3) // a short crack
        x = (x + (r() < 0.5 ? 1 : 0)) % T
        y = (y + 1) % T
      }
    }
  })
  const sand = texture(13, [p.sand[0], p.sand[0], p.sand[1], p.sand[0], p.sand[2]])
  const water = texture(17, [p.water[1], p.water[1], p.water[2], p.water[1]], (px, r) => {
    for (let y = 1; y < T; y += 4) {
      const x0 = Math.floor(r() * T)
      for (let k = 0; k < 5; k++) px((x0 + k) % T, y, p.water[0]) // a ripple
    }
  })
  const logSide = texture(19, [p.log[1], p.log[2], p.log[1]], (px) => {
    for (let x = 0; x < T; x += 3) for (let y = 0; y < T; y++) if ((y + x) % 5) px(x, y, p.log[2]) // bark grooves
  })
  const logTop = texture(23, [p.plank[0]], (px) => {
    for (let ring = 0; ring < 8; ring += 2)
      for (let i = ring; i < T - ring; i++) {
        const col = ring === 0 ? p.log[1] : p.plank[1]
        px(i, ring, col)
        px(i, T - 1 - ring, col)
        px(ring, i, col)
        px(T - 1 - ring, i, col)
      }
  })
  const leafTex = (seed: number): HTMLCanvasElement => {
    const [c, ctx] = canvas16()
    const r = rng(seed)
    for (let y = 0; y < T; y++)
      for (let x = 0; x < T; x++) {
        const roll = r()
        if (roll < 0.14) continue // holes: the sky shows through, like real leaves
        ctx.fillStyle = roll < 0.4 ? p.leaf[2] : roll < 0.8 ? p.leaf[1] : p.leaf[0]
        ctx.fillRect(x, y, 1, 1)
      }
    return c
  }
  const plank = texture(29, [p.plank[0], p.plank[1], p.plank[0]], (px) => {
    for (let y = 3; y < T; y += 4) for (let x = 0; x < T; x++) px(x, y, p.plank[2]) // board seams
    for (let y = 0; y < T; y += 4) px(y % 8 === 0 ? 2 : 10, y + 1, p.plank[2]) // nail heads
  })
  const brick = texture(31, [p.roof[0], p.roof[1], p.roof[0]], (px) => {
    for (let y = 0; y < T; y += 4) {
      for (let x = 0; x < T; x++) px(x, y, p.stone[0]) // mortar rows
      const off = (y / 4) % 2 ? 4 : 0
      for (let x = off; x < T; x += 8) for (let k = 1; k < 4; k++) px(x, y + k, p.stone[0])
    }
  })
  const glass = ((): HTMLCanvasElement => {
    const [c, ctx] = canvas16()
    ctx.fillStyle = p.glass[0]
    ctx.globalAlpha = 0.25
    ctx.fillRect(1, 1, T - 2, T - 2)
    ctx.globalAlpha = 1
    ctx.fillStyle = p.glass[2]
    ctx.fillRect(0, 0, T, 1)
    ctx.fillRect(0, T - 1, T, 1)
    ctx.fillRect(0, 0, 1, T)
    ctx.fillRect(T - 1, 0, 1, T)
    ctx.fillStyle = p.glass[0]
    for (let k = 0; k < 4; k++) ctx.fillRect(3 + k, 9 - k, 1, 1) // a glint
    return c
  })()
  const lamp = texture(37, [p.lamp[0], p.lamp[1], p.lamp[0], p.lamp[2]], (px, r) => {
    for (let i = 0; i < 10; i++) px(Math.floor(r() * T), Math.floor(r() * T), p.lamp[0])
  })
  const sprite = (draw: (px: (x: number, y: number, c: string) => void) => void): HTMLCanvasElement => {
    const [c, ctx] = canvas16()
    draw((x, y, col) => {
      ctx.fillStyle = col
      ctx.fillRect(x, y, 1, 1)
    })
    return c
  }
  const stem = (px: (x: number, y: number, c: string) => void): void => {
    for (let y = 8; y < T; y++) px(7, y, p.leaf[1])
    px(6, 11, p.leaf[0])
    px(5, 10, p.leaf[0])
    px(8, 12, p.leaf[0])
    px(9, 11, p.leaf[0])
  }
  const flowerHead = (col: readonly [string, string, string]) =>
    sprite((px) => {
      stem(px)
      for (const [x, y] of [[6, 5], [7, 5], [8, 5], [6, 6], [8, 6], [6, 7], [7, 7], [8, 7], [7, 4], [5, 6], [9, 6]]) px(x, y, col[0])
      px(7, 6, col[2])
    })
  const tallgrass = sprite((px) => {
    for (const [x0, h] of [[3, 7], [5, 10], [7, 6], [9, 11], [11, 8], [12, 5]])
      for (let y = T - h; y < T; y++) px(x0 + (y < T - h + 2 ? 1 : 0), y, y % 3 ? p.grass[1] : p.grass[2])
  })
  const flora = { flower: flowerHead(p.lamp), poppy: flowerHead(p.roof) }
  return {
    flower: { top: flora.flower, side: flora.flower },
    poppy: { top: flora.poppy, side: flora.poppy },
    tallgrass: { top: tallgrass, side: tallgrass },
    grass: { top: grassTop, side: grassSide },
    dirt: { top: dirt, side: dirt },
    stone: { top: stone, side: stone },
    sand: { top: sand, side: sand },
    water: { top: water, side: water },
    log: { top: logTop, side: logSide },
    leaf: { top: leafTex(41), side: leafTex(43) },
    plank: { top: plank, side: plank },
    roof: { top: brick, side: brick },
    glass: { top: glass, side: glass },
    lamp: { top: lamp, side: lamp },
  }
}

/** How much darker each side is than the top (the game's own face lighting). */
const SHADE = { left: 0.22, right: 0.4 } as const
/** A sliver of overlap between faces, in texels, so no hairline of sky shows through the seams. */
const SEAM = 0.35

/**
 * Draws the first `count` voxels with their textures, back to front. Each face is the 16×16 texture under an affine
 * transform onto its rhombus or parallelogram, then shaded with the edge colour. `ratio` is the device pixel ratio.
 */
export function drawTextured(
  ctx: CanvasRenderingContext2D,
  voxels: readonly Voxel[],
  count: number,
  tex: Record<Block, FaceTextures>,
  shade: string,
  u: number,
  ox: number,
  oy: number,
  ratio: number,
): void {
  const shown = voxels.slice(0, count).sort((a, b) => a.x + a.z - (b.x + b.z) || a.y - b.y || a.x - b.x)
  const k = (u / T) * (1 + (SEAM * 2) / T)
  const face = (img: HTMLCanvasElement, ax: number, ay: number, bx: number, by: number, ex: number, ey: number, dark: number): void => {
    ctx.setTransform(ratio * ax * k, ratio * ay * k, ratio * bx * k, ratio * by * k, ratio * ex, ratio * ey)
    ctx.translate(-SEAM, -SEAM)
    ctx.drawImage(img, 0, 0)
    if (dark) {
      ctx.globalAlpha = dark
      ctx.fillStyle = shade
      ctx.fillRect(0, 0, T, T)
      ctx.globalAlpha = 1
    }
  }
  ctx.imageSmoothingEnabled = false
  for (const { x, y, z, b } of shown) {
    const t = tex[b]
    const sx = Math.round(ox + (x - z) * u)
    const sy = Math.round(oy + (x + z) * (u / 2) - y * u)
    if (b === 'flower' || b === 'poppy' || b === 'tallgrass') {
      // a plant stands on the block below: an upright sprite, one cube tall, centred on that block's top
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.drawImage(t.side, sx - u / 2, sy + u / 2 - u * 0.25, u, u)
      continue
    }
    // top: texture x runs left → top corner, y runs left → bottom corner
    face(t.top, 1, -0.5, 1, 0.5, sx - u, sy + u / 2, 0)
    // left side: x runs along the bottom-left edge, y straight down
    face(t.side, 1, 0.5, 0, 1, sx - u, sy + u / 2, SHADE.left)
    // right side
    face(t.side, 1, -0.5, 0, 1, sx, sy + u, SHADE.right)
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
}

/**
 * Night light: the whole scene dims under the sky, and a finished lamp casts stepped rings of warm light on the ground
 * around the plot (rhombi on the ground plane, no blur, like the game's block light falling off a step at a time).
 */
export function drawNight(ctx: CanvasRenderingContext2D, el: Element, w: number, h: number, u: number, ox: number, oy: number, ratio: number, lit: boolean): void {
  const s = getComputedStyle(el)
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.globalAlpha = 0.3
  ctx.fillStyle = s.getPropertyValue('--bl-sky-2').trim()
  ctx.fillRect(0, 0, w, h)
  if (lit) {
    ctx.fillStyle = s.getPropertyValue('--bl-lamp-1').trim()
    const cx = PLOT_AT.x + 4
    const cz = PLOT_AT.z + 4
    for (const [radius, alpha] of [[9, 0.05], [6, 0.07], [3.5, 0.09]] as const) {
      ctx.globalAlpha = alpha
      const pt = (x: number, z: number): [number, number] => [ox + (x - z) * u, oy + (x + z) * (u / 2) + u / 2]
      const [ax, ay] = pt(cx - radius, cz - radius)
      const [bx, by] = pt(cx + radius, cz - radius)
      const [dx, dy] = pt(cx + radius, cz + radius)
      const [ex, ey] = pt(cx - radius, cz + radius)
      ctx.beginPath()
      ctx.moveTo(Math.round(ax), Math.round(ay))
      ctx.lineTo(Math.round(bx), Math.round(by))
      ctx.lineTo(Math.round(dx), Math.round(dy))
      ctx.lineTo(Math.round(ex), Math.round(ey))
      ctx.closePath()
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}
