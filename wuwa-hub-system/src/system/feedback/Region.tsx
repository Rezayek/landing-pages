import { useEffect, useLayoutEffect, useRef, type FocusEvent, type JSX, type ReactNode } from 'react'
import { announce } from './announcer'
import { cssVars, cx, useLatest } from './internal'
import { Spinner } from './Spinner'
import { FEEDBACK_TIMING, usePending, useSlow } from './usePending'

export interface RegionProps {
  /** What the region holds, lower case: "projects". Used in the announcements. */
  label: string
  /** The region is loading or refreshing. */
  busy: boolean
  /** Content from an earlier load is on screen (so a refresh keeps it and a first load shows the skeleton). */
  hasContent: boolean
  /** Shown on a first load, after the show delay. Build it from the same layout as the loaded content. */
  fallback?: ReactNode
  /** Spoken (polite) when loading ends after a wait that was announced: "12 projects loaded". */
  loadedMessage?: string
  /** Reserved height shared by the loading, empty, error and loaded states: nothing shifts between them. */
  minHeight?: string
  /**
   * The loaded shape, never shown: it holds the region's height from the first frame (use the skeleton). Better than
   * `minHeight` when the loaded size is known only as layout, such as two banner cards.
   */
  reserve?: ReactNode
  /**
   * A state laid over the region (an error with Try again): the content underneath keeps the space and is hidden, so
   * the region's size does not change when it fails or recovers.
   */
  cover?: ReactNode
  /** Show one state without running anything, for the /system page: the skeleton, or the dimmed content and its bar. */
  preview?: 'first-load' | 'refreshing'
  children: ReactNode
  className?: string
}

/**
 * One loading region. It owns the three things every async region needs, so each screen does not redo them:
 *  - first load, nothing to show: the `fallback` (a skeleton) after the show delay, in reserved space;
 *  - refresh, content on screen: the content stays, dims after the show delay, and a slim bar runs along the top
 *    edge. It is never swapped for a skeleton. The content stays usable, so it is not made inert;
 *  - `aria-busy` while loading, and one polite announcement per wait: "Loading projects" if it lasts over 1 s,
 *    then the loaded message. Waits that end sooner say nothing.
 * Focus never moves because of a background load.
 */
export function Region({
  label,
  busy,
  hasContent,
  fallback,
  loadedMessage,
  minHeight,
  reserve,
  cover,
  preview,
  children,
  className,
}: RegionProps): JSX.Element {
  const pending = usePending(busy)
  const indicator = pending || preview !== undefined
  const loading = busy || preview !== undefined
  const firstLoad = preview ? preview === 'first-load' : busy && !hasContent
  const stale = !firstLoad && loading && hasContent && indicator
  // Past the slow notice (8 s) the wait says so, as "Still saving…" does on a button: one line laid over the top of
  // the region (it moves nothing) and one announcement.
  const slow = useSlow(busy && !preview)
  const spoke = useRef(false)
  const latest = useLatest({ label, loadedMessage, covered: Boolean(cover) })
  useEffect(() => {
    if (slow) announce(`Still loading ${latest.current.label}. This is taking longer than usual.`)
  }, [slow, latest])

  // A cover that held focus (its Try again was pressed) leaves: focus goes to the region, never to the page body.
  // Removal does not move focus by itself, so only a real move out of the cover clears the flag.
  const contentRef = useRef<HTMLDivElement>(null)
  const focusInCover = useRef(false)
  const hasCover = Boolean(cover)
  useLayoutEffect(() => {
    if (hasCover || !focusInCover.current) return
    focusInCover.current = false
    if (!document.activeElement || document.activeElement === document.body) contentRef.current?.focus()
  }, [hasCover])
  const onCoverBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget
    if (next instanceof Node && !event.currentTarget.contains(next)) focusInCover.current = false
  }

  useEffect(() => {
    if (!busy) {
      if (spoke.current) {
        spoke.current = false
        const { label: what, loadedMessage: done, covered } = latest.current
        // a wait that ends in an error or empty cover is announced by that cover, never as "loaded"
        if (!covered) announce(done ?? `${what.charAt(0).toUpperCase()}${what.slice(1)} loaded.`)
      }
      return
    }
    const timer = setTimeout(() => {
      spoke.current = true
      announce(`Loading ${latest.current.label}.`)
    }, FEEDBACK_TIMING.announceStartMs)
    return () => clearTimeout(timer)
  }, [busy, latest])

  return (
    <div
      className={cx('fb fb-region', className)}
      aria-busy={loading}
      data-stale={stale ? 'true' : undefined}
      data-covered={cover ? 'true' : undefined}
      style={minHeight ? cssVars({ '--fb-region-min': minHeight }) : undefined}
    >
      {stale ? (
        <div className="fb-region__bar" aria-hidden="true">
          <span />
        </div>
      ) : null}
      {reserve ? (
        <div className="fb-region__reserve" aria-hidden="true" inert>
          {reserve}
        </div>
      ) : null}
      {/* named, so focus that lands here after a retry lands somewhere a screen reader can say */}
      <div ref={contentRef} className="fb-region__content" tabIndex={-1} role="group" aria-label={label.charAt(0).toUpperCase() + label.slice(1)}>
        {firstLoad ? (indicator ? fallback : null) : children}
      </div>
      {slow ? (
        <p className="fb-region__slow" aria-hidden="true">
          <Spinner size="sm" />
          Still loading {label}. This is taking longer than usual.
        </p>
      ) : null}
      {cover ? (
        <div className="fb-region__cover" onFocus={() => (focusInCover.current = true)} onBlur={onCoverBlur}>
          {cover}
        </div>
      ) : null}
    </div>
  )
}
