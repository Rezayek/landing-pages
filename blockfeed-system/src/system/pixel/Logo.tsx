/**
 * Blockfeed's logo, drawn in code. Three marks were drawn; "stack" is the pick (see DESIGN.md §Logo). The wordmark is
 * set in a 5 x 7 bitmap face drawn for it, one cell per unit, with a one-cell shadow. The mark's colours are fixed
 * (a brand asset, the same in both themes), so they live here and not in tokens.css.
 */
import type { JSX } from 'react'
import { Pixels } from './art'

const BRAND = {
  o: '#0d0e10',
  g: '#2f9e62',
  G: '#7ee0a8',
  s: '#1f6b43',
  c: '#c8793a',
  C: '#ecb27a',
  k: '#8a4a1e',
  w: '#f4f5f6',
  W: '#c4c6c9',
  d: '#8c8f93',
} as const

/** One bevelled bar of the stack: outline, a lit top and left, a shaded bottom and right. */
function bar(offset: number, hi: string, fill: string, sh: string): string[] {
  const pad = (row: string): string => '.'.repeat(offset) + row + '.'.repeat(12 - offset - row.length)
  return [
    pad('ooooooooo'),
    pad(`o${hi.repeat(7)}o`),
    pad(`o${hi}${fill.repeat(5)}${sh}o`),
    pad('ooooooooo'),
  ]
}

export const MARKS = {
  /** three feed cards stacked as blocks, each a step across: a feed built out of blocks */
  stack: [...bar(0, 'G', 'g', 's'), ...bar(3, 'C', 'c', 'k'), ...bar(1, 'w', 'W', 'd')],
  /** a bevelled badge carrying three lines of feed */
  badge: [
    'oooooooooooo',
    'oGGGGGGGGGGo',
    'oGggggggggso',
    'oGwwwwwwwwso',
    'oGggggggggso',
    'oGwwwwwwggso',
    'oGggggggggso',
    'oGwwwwwwwwso',
    'oGggggggggso',
    'oGgggggggsso',
    'osssssssssso',
    'oooooooooooo',
  ],
  /** a post: a speech block with three lines of feed and a tail */
  post: [
    '.oooooooooo.',
    'oGGGGGGGGGGo',
    'oGwwwwwwwwso',
    'oGggggggggso',
    'oGwwwwwwggso',
    'oGggggggggso',
    'oGwwwwwwwwso',
    'oGgggggggsso',
    '.osssssssso.',
    '.oooooooooo.',
    '..oGo.......',
    '...oo.......',
  ],
} as const

export type MarkName = keyof typeof MARKS

export function Mark({ name = 'stack', cell = 2, label }: { name?: MarkName; cell?: number; label?: string }): JSX.Element {
  return <Pixels rows={MARKS[name]} colors={BRAND} cell={cell} shadow="rgb(0 0 0 / 0.35)" label={label} />
}

const FONT: Record<string, readonly string[]> = {
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
}

/** Lays a word out in the bitmap face: 1 cell between letters. `split` letters on the left use `a`, the rest `b`. */
function word(text: string, split: number): { rows: string[]; width: number } {
  const rows = Array.from({ length: 7 }, () => '')
  ;[...text].forEach((ch, i) => {
    const glyph = FONT[ch]
    if (!glyph) return
    const mark = i < split ? 'a' : 'b'
    glyph.forEach((line, y) => {
      rows[y] += line.replaceAll('#', mark) + (i < text.length - 1 ? '.' : '')
    })
  })
  return { rows, width: rows[0].length }
}

/** BLOCK in ink and FEED in the accent; both follow the theme through the parent's colour and --accent. */
export function Wordmark({ cell = 1, label = 'Blockfeed' }: { cell?: number; label?: string }): JSX.Element {
  const { rows } = word('BLOCKFEED', 5)
  return (
    <Pixels
      rows={rows}
      colors={{ a: 'var(--logo-ink, currentColor)', b: 'var(--logo-accent, var(--accent))' }}
      cell={cell}
      shadow="var(--logo-shadow, var(--text-shadow))"
      label={label}
    />
  )
}

/** The lockup: the mark, then the wordmark. `compact` drops the wordmark for a 24 px app icon or a tab. */
export function Logo({ compact = false, markName = 'stack' }: { compact?: boolean; markName?: MarkName }): JSX.Element {
  return (
    <span className="px-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--u) * 3)' }}>
      <Mark name={markName} cell={2} label={compact ? 'Blockfeed' : undefined} />
      {compact ? null : <Wordmark />}
    </span>
  )
}
