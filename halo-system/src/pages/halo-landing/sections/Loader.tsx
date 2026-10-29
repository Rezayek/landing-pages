/**
 * The loading screen (UX.md A0, the person's choice on 2026-10-29): the black stage with the halo ring filling as the
 * 3D watch loads (its maps, its shaders, its textures), so the page opens with nothing left to load. The ring is the
 * page's own signature, the same lit ring that later closes on the pre-order. "Show the page now" opens the page at
 * once (the poster holds the frame until the watch is ready), and after 10 s it opens by itself.
 */
import { useEffect, useState, type JSX } from 'react'
import { Wordmark } from '@/system/halo'
import { durationMs } from '@/system/motion'

export interface LoaderProps {
  /** 0-1. */
  progress: number
  /** The page is ready (or the visitor skipped): the screen fades and leaves. */
  done: boolean
  reduced: boolean
  onSkip: () => void
}

export function Loader({ progress, done, reduced, onSkip }: LoaderProps): JSX.Element | null {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setGone(true), reduced ? 0 : durationMs.scene)
    return () => window.clearTimeout(t)
  }, [done, reduced])
  if (gone) return null
  const pct = Math.round(Math.min(1, progress) * 100)
  return (
    <div className="loader" data-stage="black" data-done={done || undefined}>
      <div className="loader__mark">
        <Wordmark width={92} />
      </div>
      <div
        className="loader__ring"
        role="progressbar"
        aria-label="Preparing the 3D watch"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
          <circle className="loader__track" cx="80" cy="80" r="66" />
          <circle className="loader__arc" cx="80" cy="80" r="66" pathLength="1" style={{ strokeDashoffset: 1 - Math.min(1, progress) }} />
        </svg>
        <span className="loader__pct">
          {pct}
          <span>%</span>
        </span>
      </div>
      <p className="loader__label">Preparing the 3D watch</p>
      <button type="button" className="loader__skip" onClick={onSkip}>
        Show the page now
      </button>
    </div>
  )
}
