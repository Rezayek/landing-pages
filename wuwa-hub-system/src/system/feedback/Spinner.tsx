import type { JSX } from 'react'
import { cx } from './internal'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /**
   * What is loading ("Loading Resonators"). Give one whenever nearby text does not already say it. Leave it out
   * only inside a control whose label does (a button reading "Saving build…").
   */
  label?: string
  className?: string
}

/** Two periods of a sine, drawn twice side by side so a half-width translation loops without a seam. */
export function WavePath(): JSX.Element {
  return (
    <svg viewBox="0 0 48 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M0 6 C3 0 9 0 12 6 S21 12 24 6 S33 0 36 6 S45 12 48 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * The waveform loader (MOTION-SYSTEM.md, verb `tune`): a short frequency line that hums while work is going on. It
 * takes the colour of the surrounding text.
 *
 * It carries state ("still alive"), so under reduced motion it keeps moving, slower and flatter (`--wave-period`,
 * `--wave-amp`), instead of freezing. Do not announce from here: one message per wait goes through `announce()`.
 * Use one per region, at most one per screen.
 */
export function Spinner({ size = 'md', label, className }: SpinnerProps): JSX.Element {
  return (
    <span
      className={cx('fb fb-spinner ea-wave', className)}
      data-size={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <WavePath />
    </span>
  )
}
