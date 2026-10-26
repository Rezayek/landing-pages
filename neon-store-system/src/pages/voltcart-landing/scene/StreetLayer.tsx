/**
 * The fixed layer behind the page: the first frame of the street film paints first (the LCP candidate and the
 * reduced-motion and Save-Data view), then the film player loads after first paint and cross-fades in over it once
 * its first pass of frames is in (three-d.md §Loading). A small HUD tag reports real loading progress; it is
 * decorative, so screen readers skip it (every fact is in the HTML).
 */
import { Suspense, lazy, useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { useMotionPaused } from '@/system/components'

const FilmPlayer = lazy(() => import('./FilmPlayer'))

function canRunFilm(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (document.documentElement.dataset.motion === 'reduced') return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  return !new URLSearchParams(window.location.search).has('no-film')
}

export function StreetLayer(): JSX.Element {
  const paused = useMotionPaused()
  const [mount, setMount] = useState(false)
  const [ready, setReady] = useState(false)
  const [glitch, setGlitch] = useState(false)
  const [failed, setFailed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [phone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 47.99rem)').matches)
  const glitchTimer = useRef(0)

  useEffect(() => {
    if (!canRunFilm()) return
    // Desktop: after first paint, when the main thread is idle. Phones: on the first scroll or touch, so a phone
    // that only reads the first screen never downloads the film (the poster is its first frame).
    if (phone) {
      const go = () => setMount(true)
      const opts = { once: true, passive: true } as const
      window.addEventListener('scroll', go, opts)
      window.addEventListener('touchstart', go, opts)
      window.addEventListener('pointerdown', go, opts)
      return () => {
        window.removeEventListener('scroll', go)
        window.removeEventListener('touchstart', go)
        window.removeEventListener('pointerdown', go)
      }
    }
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const id = idle(() => setMount(true), { timeout: 1500 })
    return () => cancel(id)
  }, [phone])

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => () => window.clearTimeout(glitchTimer.current), [])

  const onReady = useCallback(() => setReady(true), [])
  const onFail = useCallback(() => setFailed(true), [])
  const onGlitch = useCallback(() => {
    setGlitch(true)
    window.clearTimeout(glitchTimer.current)
    glitchTimer.current = window.setTimeout(() => setGlitch(false), 420)
  }, [])

  return (
    <div className="vl-street" data-ready={ready || undefined} data-glitch={glitch || undefined} aria-hidden="true">
      <picture>
        <source media="(max-aspect-ratio: 20/23)" srcSet="/voltcart-landing/film/phone/f-001.webp" />
        <source media="(max-width: 47.99rem)" srcSet="/voltcart-landing/film/tablet/f-001.webp" />
        <img className="vl-street__poster" src="/voltcart-landing/film/desktop/f-001.webp" alt="" fetchPriority="high" decoding="async" />
      </picture>
      {mount ? (
        <div className="vl-street__canvas">
          <Suspense fallback={null}>
            <FilmPlayer paused={paused} active={visible} onReady={onReady} onProgress={setProgress} onGlitch={onGlitch} onFail={onFail} />
          </Suspense>
        </div>
      ) : null}
      <div className="vl-street__grade" />
      {mount && !ready && !failed ? <p className="vl-street__tag">Loading the street {progress}%</p> : null}
    </div>
  )
}
