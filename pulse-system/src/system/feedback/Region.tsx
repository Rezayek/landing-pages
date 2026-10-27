import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { announce } from './announcer'
import { cssVars, cx, useLatest } from './internal'
import { FEEDBACK_TIMING, usePending } from './usePending'

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
  preview,
  children,
  className,
}: RegionProps): JSX.Element {
  const pending = usePending(busy)
  const indicator = pending || preview !== undefined
  const loading = busy || preview !== undefined
  const firstLoad = preview ? preview === 'first-load' : busy && !hasContent
  const stale = !firstLoad && loading && hasContent && indicator
  const spoke = useRef(false)
  const latest = useLatest({ label, loadedMessage })
  // past the slow-notice time a wait says so, once, in words (guides/interaction.md: the 8 s notice)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!busy) {
      setSlow(false)
      return
    }
    const timer = setTimeout(() => {
      setSlow(true)
      announce(`Still loading ${latest.current.label}. This is taking longer than usual.`)
    }, FEEDBACK_TIMING.slowNoticeMs)
    return () => clearTimeout(timer)
  }, [busy, latest])

  useEffect(() => {
    if (!busy) {
      if (spoke.current) {
        spoke.current = false
        const { label: what, loadedMessage: done } = latest.current
        announce(done ?? `${what.charAt(0).toUpperCase()}${what.slice(1)} loaded.`)
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
      style={minHeight ? cssVars({ '--fb-region-min': minHeight }) : undefined}
    >
      {stale ? (
        <div className="fb-region__bar" aria-hidden="true">
          <span />
        </div>
      ) : null}
      {slow && busy ? <p className="fb-region__slow">Still loading {label}. This is taking longer than usual.</p> : null}
      <div className="fb-region__content">{firstLoad ? (indicator ? fallback : null) : children}</div>
    </div>
  )
}
