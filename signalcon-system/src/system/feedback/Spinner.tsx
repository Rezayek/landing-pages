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
 * The signal loader: four bars that light in turn while work is going on (SIGNAL//CON skin; the behaviour is the
 * starter's). It takes the colour of the surrounding text; the lit bar is the signal colour.
 *
 * It carries state ("still alive"), so under reduced motion two bars stay lit, still, and the label carries it.
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
    >
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}
