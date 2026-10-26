import { useEffect, useId, useRef, useState, type JSX } from 'react'
import { announce } from './announcer'
import { cssVars, cx } from './internal'
import { WavePath } from './Spinner'

export interface ProgressBarProps {
  /** 0 to 100. Leave it out for an indeterminate bar (work of unknown length, expected under about 10 s). */
  value?: number
  /** What is happening, as a verb with a count: "Matching 3 of 12 zones". Always shown: a bar alone says nothing. */
  label: string
  /** An estimate or a second line: "about 20 s left". Pad estimates; do not promise precision. */
  detail?: string
  /** Pass this for anything that can run past 10 s: a clearly marked way to stop. */
  onCancel?: () => void
  cancelLabel?: string
  /** Spoken once when the bar reaches 100. */
  completeMessage?: string
  /** Announce progress every this many percent (default 25), or `false` for never. Never on every tick. */
  announceEvery?: number | false
  className?: string
}

/**
 * Determinate and indeterminate progress.
 *  - Determinate: `role="progressbar"` with `aria-valuenow`. The bar never moves backwards (a lower value is held at
 *    the highest seen; 0 starts over), and it announces at intervals through the live region, not on every tick.
 *  - Indeterminate: no `aria-valuenow`. The moving segment keeps moving under reduced motion, slower, because it
 *    carries state.
 * The fill is a `transform: scaleX`, never an animated width. Under reduced motion it still fills, without easing.
 */
export function ProgressBar({
  value,
  label,
  detail,
  onCancel,
  cancelLabel = 'Cancel',
  completeMessage,
  announceEvery = 25,
  className,
}: ProgressBarProps): JSX.Element {
  const labelId = useId()
  const requested = value === undefined ? undefined : Math.min(100, Math.max(0, value))

  // Never backwards: hold the highest value seen until the caller restarts at 0.
  const [peak, setPeak] = useState(0)
  const shown = requested === undefined ? undefined : requested === 0 ? 0 : Math.max(requested, peak)
  if (shown !== undefined && shown !== peak) setPeak(shown)

  const band = useRef(0)
  useEffect(() => {
    if (shown === undefined || announceEvery === false) return
    if (shown === 0) {
      band.current = 0
      return
    }
    if (shown >= 100) {
      if (band.current < 100) {
        band.current = 100
        if (completeMessage) announce(completeMessage)
      }
      return
    }
    const reached = Math.floor(shown / announceEvery)
    if (reached > band.current) {
      band.current = reached
      announce(`${label}, ${Math.round(reached * announceEvery)}%`)
    }
  }, [shown, announceEvery, label, completeMessage])

  const determinate = shown !== undefined
  return (
    <div className={cx('fb fb-progress', className)}>
      <div className="fb-progress__head">
        <span id={labelId} className="fb-progress__label">
          {label}
        </span>
        {detail ? <span className="fb-progress__detail">{detail}</span> : null}
      </div>
      <div className="fb-progress__row">
        <div
          className="fb-progress__track"
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={determinate ? Math.round(shown) : undefined}
        >
          <span
            className="fb-progress__fill"
            data-indeterminate={determinate ? undefined : ''}
            style={determinate ? cssVars({ '--fb-progress': shown / 100 }) : undefined}
          />
          {/* The tuning leading edge (MOTION-SYSTEM.md, Progress): a short waveform riding the end of the fill. */}
          {determinate && shown < 100 ? (
            <span className="fb-progress__edge ea-wave" style={cssVars({ '--fb-progress': shown / 100 })} aria-hidden="true">
              <WavePath />
            </span>
          ) : null}
        </div>
        {onCancel ? (
          <button type="button" className="fb fb-btn" data-variant="ghost" data-state="idle" onClick={onCancel}>
            {cancelLabel}
          </button>
        ) : null}
      </div>
    </div>
  )
}
