/**
 * The pixel layer. A sprite is a grid of characters; each character names a colour. It renders as one SVG whose cells
 * are whole units (`--u`), with `shape-rendering: crispEdges`, so it stays on the pixel grid at every GUI scale.
 * Contiguous cells of one colour merge into one rectangle, so a 10 x 10 icon is a handful of path commands.
 *
 * Every sprite in the system is drawn here, in code, for Blockfeed. Nothing is traced from or copied out of a game.
 */
import type { CSSProperties, JSX } from 'react'

export type Colors = Readonly<Record<string, string>>

/** Path data for every cell of `key`, as horizontal runs. `dx` and `dy` move the whole shape (the drop shadow). */
export function runsFor(rows: readonly string[], key: string, dx = 0, dy = 0): string {
  let d = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== key) {
        x++
        continue
      }
      let n = 1
      while (row[x + n] === key) n++
      d += `M${x + dx} ${y + dy}h${n}v1h-${n}z`
      x += n
    }
  })
  return d
}

/** Every filled cell of `rows`, whatever its colour, as one path: the silhouette a drop shadow is cut from. */
function silhouette(rows: readonly string[], dx: number, dy: number): string {
  let d = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] === '.' || row[x] === ' ') {
        x++
        continue
      }
      let n = 1
      while (row[x + n] !== undefined && row[x + n] !== '.' && row[x + n] !== ' ') n++
      d += `M${x + dx} ${y + dy}h${n}v1h-${n}z`
      x += n
    }
  })
  return d
}

export interface PixelsProps {
  readonly rows: readonly string[]
  readonly colors: Colors
  /** cell size in units: 1 draws each cell as one unit, 2 doubles the sprite */
  readonly cell?: number
  /** a hard drop shadow one cell down and right, in this colour */
  readonly shadow?: string
  readonly label?: string
  readonly className?: string
  readonly style?: CSSProperties
}

export function Pixels({ rows, colors, cell = 1, shadow, label, className, style }: PixelsProps): JSX.Element {
  const h = rows.length
  const w = rows[0]?.length ?? 0
  const keys = Object.keys(colors)
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width={`calc(var(--u) * ${w * cell})`}
      height={`calc(var(--u) * ${h * cell})`}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ display: 'block', overflow: 'visible', flex: 'none', ...style }}
    >
      {shadow ? <path d={silhouette(rows, 1, 1)} fill={shadow} /> : null}
      {keys.map((key) => {
        const d = runsFor(rows, key)
        return d ? <path key={key} d={d} fill={colors[key]} /> : null
      })}
    </svg>
  )
}

/** A small seeded random generator, so a name or an id always draws the same avatar and the same screenshot. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
