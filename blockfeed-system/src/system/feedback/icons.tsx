import type { JSX } from 'react'
import { Icon } from '../pixel/Icon'
import type { IconName } from '../pixel/icons'
import { cx } from './internal'

/**
 * The few glyphs the feedback components need, drawn in the project's own pixel set (pixel/icons.ts) so they sit on the
 * same grid as everything else and take the text colour. Same names and same one-line contract as the reference set:
 * they are always decorative, and the meaning is in the text beside them, never in the icon alone.
 */
function Glyph({ name, large }: { name: IconName; large?: boolean }): JSX.Element {
  return <Icon name={name} size={large ? 'lg' : 'md'} className={cx('fb-icon')} />
}

export const CheckIcon = (): JSX.Element => <Glyph name="check" />
export const CloseIcon = (): JSX.Element => <Glyph name="cross" />
export const InfoIcon = (): JSX.Element => <Glyph name="info" />
export const SuccessIcon = (): JSX.Element => <Glyph name="check" />
export const WarningIcon = (): JSX.Element => <Glyph name="warn" />
export const ErrorIcon = (): JSX.Element => <Glyph name="cross" />
/** First use: an empty screenshot frame. */
export const InboxIcon = (): JSX.Element => <Glyph name="image" large />
export const SearchIcon = (): JSX.Element => <Glyph name="search" large />
export const LockIcon = (): JSX.Element => <Glyph name="lock" large />

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

/** The icon for a tone. Neutral has none. */
export function ToneIcon({ tone }: { tone: Tone }): JSX.Element | null {
  switch (tone) {
    case 'info':
      return <InfoIcon />
    case 'success':
      return <SuccessIcon />
    case 'warning':
      return <WarningIcon />
    case 'error':
      return <ErrorIcon />
    default:
      return null
  }
}
