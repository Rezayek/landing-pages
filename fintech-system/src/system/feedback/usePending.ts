import { useEffect, useState } from 'react'

/**
 * The numbers behind the feedback components. They follow guides/interaction.md §Response times and §Loading in
 * the workflow skill; the evidence is in references/standards/loading.md. The 400 ms delay, the 500 ms minimum and
 * the slow and timeout limits are project choices (no standard publishes them), so change them here, in one place.
 */
export const FEEDBACK_TIMING = {
  /** An indicator for work of unknown length appears only after this long, so quick work never flashes one. */
  showDelayMs: 400,
  /** Once an indicator is visible it stays at least this long, so it never flickers. */
  minShownMs: 500,
  /** A wait that is still going after this long is announced once ("Loading projects"). */
  announceStartMs: 1000,
  /** After this long the label changes to "Still working" and is announced. */
  slowNoticeMs: 8000,
  /** After this long a wait the person can stop offers Cancel (guides/interaction.md: over 10 s, a way out). */
  cancelAfterMs: 10000,
  /** After this long an action is aborted and shown as failed, with a way to retry. */
  timeoutMs: 30000,
  /** How long "Saved" with a check stays in the control before it returns to rest. */
  successHoldMs: 1500,
} as const

export interface PendingOptions {
  /** Wait this long before showing. 0 shows at once: use it for work known to be slow (uploads, AI drafts, imports). */
  delay?: number
  /** Keep the indicator at least this long once shown. */
  minDuration?: number
}

/**
 * Turns "is the work pending" into "should an indicator be visible".
 *  - Pending for less than `delay`: never visible (no flash).
 *  - Visible: stays for at least `minDuration`, even if the work ends sooner (no flicker).
 * The control's own pressed or pending look is NOT delayed: set that in the event handler from the state itself.
 */
export function usePending(
  isPending: boolean,
  { delay = FEEDBACK_TIMING.showDelayMs, minDuration = FEEDBACK_TIMING.minShownMs }: PendingOptions = {},
): boolean {
  const [shownAt, setShownAt] = useState<number | null>(null)
  const shown = shownAt !== null

  useEffect(() => {
    if (isPending) {
      if (shownAt !== null) return
      const timer = setTimeout(() => setShownAt(performance.now()), Math.max(0, delay))
      return () => clearTimeout(timer)
    }
    if (shownAt !== null) {
      const left = Math.max(0, minDuration - (performance.now() - shownAt))
      const timer = setTimeout(() => setShownAt(null), left)
      return () => clearTimeout(timer)
    }
  }, [isPending, shownAt, delay, minDuration])

  // With no delay the indicator is visible in the same render as the pending state; the timer above only starts
  // the minimum-time clock.
  return shown || (isPending && delay <= 0)
}

/** True once `active` has lasted `afterMs`. Resets when `active` ends. Drives the "Still working" notice. */
export function useSlow(active: boolean, afterMs: number = FEEDBACK_TIMING.slowNoticeMs): boolean {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setSlow(true), afterMs)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [active, afterMs])
  return active && slow
}
