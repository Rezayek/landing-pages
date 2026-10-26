import type { JSX } from 'react'
import { cx } from './internal'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /**
   * What is loading ("Loading projects"). Give one whenever nearby text does not already say it. Leave it out
   * only inside a control whose label does (a button reading "Saving…").
   */
  label?: string
  className?: string
}

/**
 * A ring that turns while work is going on. It takes the colour of the surrounding text.
 *
 * It carries state ("still alive"), so under reduced motion it keeps turning, slower, instead of freezing.
 * Do not announce from here: one message per wait goes through `announce()` (see LiveRegion), and the owner of the
 * wait decides when. Use one spinner per region, at most one per screen.
 */
export function Spinner({ size = 'md', label, className }: SpinnerProps): JSX.Element {
  return (
    <span
      className={cx('fb fb-spinner', className)}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
