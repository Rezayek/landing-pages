import type { JSX } from 'react'
import { cx } from './internal'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /**
   * What is loading ("Loading tasting times"). Give one whenever nearby text does not already say it. Leave it out
   * only inside a control whose label does (a button reading "Booking…").
   */
  label?: string
  className?: string
}

/**
 * The turntable: a ring with one bead riding its rim, turning once every `--dur-turn` (MOTION-SYSTEM.md, `turn`).
 * The ring takes `--line-strong`, the bead the surrounding text colour inside a control and `--accent` alone.
 *
 * It carries state ("still alive"), so under reduced motion it keeps turning, slower, instead of freezing.
 * Do not announce from here: one message per wait goes through `announce()`, and the owner of the wait decides
 * when. One spinner per region, at most one per screen.
 */
export function Spinner({ size = 'md', label, className }: SpinnerProps): JSX.Element {
  return (
    <span
      className={cx('fb fb-spinner ms-turn', className)}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="ms-turn__bead" />
    </span>
  )
}
