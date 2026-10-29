/**
 * The watch's procedural surface maps as raw RGBA pixels: no three.js, no DOM, so a Web Worker can build them off
 * the main thread (mapsWorker.ts) and the page never stalls while the 3D starts (mapCache.ts turns them into
 * textures). Every map is tileable and seeded, so each visit draws the same surfaces.
 */

export interface RawMap {
  size: number
  data: Uint8Array
}

export type FinishKind = 'blasted' | 'brushed' | 'silicone'

export interface RawMaps {
  blasted: { rough: RawMap; normal: RawMap }
  brushed: { rough: RawMap; normal: RawMap }
  silicone: { rough: RawMap; normal: RawMap }
  /** The pocket floor's lathe rings. */
  turned: RawMap
  /** The pouch cell's soft laminate wrinkles. */
  wrinkle: RawMap
}

function seeded(seed: number): () => number {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** A height field for a finish: brushed streaks along x, or a grain blurred to its scale; silicone gets moulding pits. */
function heightField(kind: FinishKind, size: number): Float32Array {
  const rnd = seeded(kind === 'brushed' ? 11 : kind === 'silicone' ? 23 : 7)
  const h = new Float32Array(size * size)
  const row = Array.from({ length: size }, rnd)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) h[y * size + x] = kind === 'brushed' ? 0.8 * row[y] + 0.2 * rnd() : rnd()
  const passes = kind === 'blasted' ? 1 : kind === 'silicone' ? 3 : 0
  for (let p = 0; p < passes; p++) {
    const src = h.slice()
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let sum = 0
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += src[((y + dy + size) % size) * size + ((x + dx + size) % size)]
        h[y * size + x] = sum / 9
      }
    }
  }
  if (kind === 'silicone') {
    for (let i = 0; i < size * 1.5; i++) {
      const cx = Math.floor(rnd() * size), cy = Math.floor(rnd() * size)
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const d = Math.hypot(dx, dy)
          if (d <= 2) h[((cy + dy + size) % size) * size + ((cx + dx + size) % size)] -= 0.08 * (1 - d / 2)
        }
      }
    }
  }
  return h
}

/** A normal map from a height function: the slope in x and y at each pixel, packed into RGB. */
function normalMap(size: number, height: (x: number, y: number) => number, strength: number): RawMap {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * strength
      const ny = (height(x, y - 1) - height(x, y + 1)) * strength
      const len = Math.hypot(nx, ny, 1)
      const i = (y * size + x) * 4
      data[i] = Math.round((nx / len * 0.5 + 0.5) * 255)
      data[i + 1] = Math.round((ny / len * 0.5 + 0.5) * 255)
      data[i + 2] = Math.round((1 / len * 0.5 + 0.5) * 255)
      data[i + 3] = 255
    }
  }
  return { size, data }
}

/** A finish as a pair of maps from one height field: roughness (grey) and the normal map that matches it. */
export function finishMaps(kind: FinishKind, contrast: number, strength: number, size = 512): { rough: RawMap; normal: RawMap } {
  const h = heightField(kind, size)
  let lo = Infinity, hi = -Infinity
  for (const v of h) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const at = (x: number, y: number): number => (h[((y + size) % size) * size + ((x + size) % size)] - lo) / (hi - lo)
  const rough = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    const v = Math.round(255 * (0.6 + ((h[i] - lo) / (hi - lo) - 0.5) * contrast))
    rough[i * 4] = rough[i * 4 + 1] = rough[i * 4 + 2] = v
    rough[i * 4 + 3] = 255
  }
  return { rough: { size, data: rough }, normal: normalMap(size, at, strength) }
}

/** The pocket floor's turned finish: fine concentric rings left by the lathe. */
export function turnedNormal(size = 512): RawMap {
  const rnd = seeded(5)
  const rings = Array.from({ length: 400 }, rnd)
  const height = (x: number, y: number): number => {
    const r = Math.hypot(x - size / 2, y - size / 2) * 1.6
    return rings[Math.floor(r) % rings.length] * 0.7 + Math.sin(r * 1.7) * 0.3
  }
  return normalMap(size, height, 0.8)
}

/** Soft wrinkles in the pouch's aluminium laminate. */
export function wrinkleNormal(size = 256): RawMap {
  const rnd = seeded(13)
  const h = new Float32Array(size * size)
  for (let i = 0; i < 9; i++) {
    const x0 = rnd() * size, y0 = rnd() * size, a = rnd() * Math.PI, len = 40 + rnd() * 120, amp = 0.4 + rnd() * 0.6
    for (let t = 0; t < len; t++) {
      const x = Math.floor(x0 + Math.cos(a) * t), y = Math.floor(y0 + Math.sin(a) * t)
      for (let d = -4; d <= 4; d++) h[((y + size) % size) * size + ((x + d + size) % size)] += amp * (1 - Math.abs(d) / 5)
    }
  }
  return normalMap(size, (x, y) => h[((y + size) % size) * size + ((x + size) % size)], 0.6)
}

export function buildAll(): RawMaps {
  return {
    blasted: finishMaps('blasted', 0.55, 2.2),
    brushed: finishMaps('brushed', 0.5, 1.6),
    silicone: finishMaps('silicone', 0.35, 4),
    turned: turnedNormal(),
    wrinkle: wrinkleNormal(),
  }
}

/** Every pixel buffer in a set, for a zero-copy transfer out of the worker. */
export function buffers(maps: RawMaps): ArrayBuffer[] {
  return [maps.blasted, maps.brushed, maps.silicone].flatMap((m) => [m.rough.data.buffer, m.normal.data.buffer]).concat(maps.turned.data.buffer, maps.wrinkle.data.buffer) as ArrayBuffer[]
}
