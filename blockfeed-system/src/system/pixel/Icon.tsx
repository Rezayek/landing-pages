import type { CSSProperties, JSX } from 'react'
import { Pixels } from './art'
import { GLYPHS, ICONS, type GlyphName, type IconName } from './icons'

export type IconSize = 'sm' | 'md' | 'lg'

export interface IconProps {
  readonly name: IconName | GlyphName
  /** sm: the 8-cell glyph where one exists (16 px), md: 1 unit per cell (20 px), lg: 2 units per cell (40 px) */
  readonly size?: IconSize
  /** a hard one-cell shadow, the way the game draws text and items on a face */
  readonly shadow?: boolean
  /** an accessible name; without it the icon is decorative and hidden from assistive technology */
  readonly label?: string
  readonly className?: string
  readonly style?: CSSProperties
}

const COLORS = { '#': 'currentColor', '+': 'var(--icon-accent, currentColor)' } as const

/** Pixel icons take their colour from the text beside them. One accent cell per icon may take --icon-accent. */
export function Icon({ name, size = 'md', shadow = false, label, className, style }: IconProps): JSX.Element {
  const small = size === 'sm' && name in GLYPHS
  const rows = small ? GLYPHS[name as GlyphName] : (ICONS[name as IconName] ?? GLYPHS[name as GlyphName])
  return (
    <Pixels
      rows={rows}
      colors={COLORS}
      cell={size === 'lg' ? 2 : 1}
      shadow={shadow ? 'var(--icon-shadow, var(--text-shadow))' : undefined}
      label={label}
      className={className}
      style={style}
    />
  )
}
