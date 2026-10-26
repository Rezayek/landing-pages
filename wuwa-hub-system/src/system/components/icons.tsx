import type { JSX, SVGProps } from 'react'

/**
 * The Echo Atlas icon set: authored for this system (FOUNDATIONS.md §7), geometric line glyphs on a 24 grid with a
 * 1.5 px stroke (`--icon-stroke`) and square caps. No third-party set and nothing taken from the game. An icon takes
 * the colour of the text beside it; decorative ones are aria-hidden, meaningful ones get a label.
 */
const PATHS = {
  home: 'M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5',
  resonators: 'M5 3h10l4 4v14H5zM9 17c0-2 1.3-3 3-3s3 1 3 3M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4',
  echo: 'M12 3 21 12 12 21 3 12zM12 8.5 15.5 12 12 15.5 8.5 12z',
  planner: 'M3 4h7v7H3zM14 4h7v4h-7zM14 11h7v4h-7zM3 15h3v5H3zM10 15h4v5h-4zM18 18h3v2h-3',
  team: 'M3 6h5v12H3zM9.5 4h5v16h-5zM16 6h5v12h-5z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h3',
  tier: 'M4 5h16M4 10h12M4 15h8M4 20h4',
  guide: 'M5 4h9l5 5v11H5zM14 4v5h5M8 13h8M8 16.5h6',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 21c.8-4 3.8-6 7.5-6s6.7 2 7.5 6',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M15.3 15.3 21 21',
  close: 'M6 6l12 12M18 6 6 18',
  chevronDown: 'm6 9 6 6 6-6',
  chevronUp: 'm6 15 6-6 6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  chevronRight: 'm9 6 6 6-6 6',
  star: 'M12 3.5 14.6 9l5.9.6-4.5 4 1.3 5.9L12 16.4 6.7 19.5 8 13.6l-4.5-4L9.4 9z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  filter: 'M4 5h16l-6 8v6l-4 1v-7z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5',
  monitor: 'M3 5h18v11H3zM8 20h8M12 16v4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  check: 'm5 12.5 4.5 4.5L19 7',
  warning: 'M12 3 22 20H2zM12 10v4.5M12 17.5h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 11v5.5M12 7.5h.01',
  error: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M8 12h8',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  trash: 'M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  offline: 'M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4.3-2.5M19 13a10 10 0 0 0-3-2M12 20h.01',
  sync: 'M20 11a8 8 0 0 0-14.7-4.4M4 4v3h3M4 13a8 8 0 0 0 14.7 4.4M20 20v-3h-3',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  arrowDown: 'M12 5v14M6 13l6 6 6-6',
  sort: 'M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M4 6h16M4 12h16M4 18h16',
  menu: 'M4 7h16M4 12h16M4 17h10',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 5v14l11-7z',
  weapon: 'M5 19 15 9M13 5l6 6M14 6l-4-1M18 10l1 4M4 20l2-2',
} as const

export type IconName = keyof typeof PATHS

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** One of the icon size tokens; defaults to the small step, paired with 14 px text. */
  size?: 'sm' | 'md' | 'lg'
  /** Give a label only when the icon carries meaning alone; otherwise it is decorative. */
  label?: string
}

const SIZE = { sm: 'var(--icon-sm)', md: 'var(--icon-md)', lg: 'var(--icon-lg)' } as const

export function Icon({ name, size = 'sm', label, style, ...rest }: IconProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className="ea-icon"
      style={{ inlineSize: SIZE[size], blockSize: SIZE[size], flex: 'none', strokeWidth: 'var(--icon-stroke)', ...style }}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

/* Element sigils: our own six shapes, drawn for this system and unlike the game's icons. The colour is the element's
   data role (--el-*); the name always sits beside it in ink (COMPONENTS.md, Element mark). */
export type Element = 'glacio' | 'fusion' | 'electro' | 'aero' | 'spectro' | 'havoc'

export const ELEMENTS: readonly Element[] = ['glacio', 'fusion', 'electro', 'aero', 'spectro', 'havoc']

export const ELEMENT_LABEL: Readonly<Record<Element, string>> = {
  glacio: 'Glacio',
  fusion: 'Fusion',
  electro: 'Electro',
  aero: 'Aero',
  spectro: 'Spectro',
  havoc: 'Havoc',
}

const SIGILS: Readonly<Record<Element, string>> = {
  // snowflake facet: three crossing strokes with a diamond core
  glacio: 'M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M12 9l2.5 3-2.5 3-2.5-3z',
  // flame wedge: a pointed drop cut by a notch
  fusion: 'M12 2.5c4 4.5 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 8 7 12 2.5M12 21v-6l-3-3',
  // bolt fork: a zigzag that splits in two
  electro: 'M14 2.5 7 13h5l-2 8.5L17 11h-5zM17 11l3.5 2M7 13l-3.5-2',
  // swirl: an opening spiral
  aero: 'M21 12a9 9 0 1 1-9-9M12 18a6 6 0 1 1 6-6M12 15a3 3 0 1 1 3-3',
  // sun ring: a ring with four diamond rays
  spectro: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9M12 1.5l1.5 3h-3zM12 22.5l-1.5-3h3zM1.5 12l3-1.5v3zM22.5 12l-3 1.5v-3z',
  // crescent split: a crescent crossed by a slash
  havoc: 'M15.5 3.5A9 9 0 1 0 20.5 15a7 7 0 1 1-5-11.5M4 20 20 4',
}

export function Sigil({
  element,
  size = 'sm',
  label,
}: {
  element: Element
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
}): JSX.Element {
  const box = size === 'xl' ? '4rem' : SIZE[size]
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={`var(--el-${element})`}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className="ea-sigil"
      data-element={element}
      style={{ inlineSize: box, blockSize: box, flex: 'none', strokeWidth: size === 'xl' ? 1 : 'var(--icon-stroke)' }}
    >
      <path d={SIGILS[element]} />
    </svg>
  )
}
