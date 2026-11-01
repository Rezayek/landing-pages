/**
 * The start: the set powers on (MOTION.md "Boot"). A line opens to a screen of static, the wordmark slams in, the
 * readout searches CH 01 to CH 27 and finds the signal, then the screen wipes off on the diagonal while the hero's
 * own tune-in starts under it on CH 27. The power-on and the first static are plain HTML in index.html (#preboot), so
 * they paint with the first frame; this component takes over from them when the page's code arrives. First visit per
 * session only; any tap, key or scroll skips it; it ends when the fonts and the key art are ready, at least 950 ms
 * and at most 2 s after the page was requested. Reduced motion: no boot, the page is simply there. Decorative:
 * aria-hidden, nothing to announce, and the page under it is already in the tree. Styles: boot.css.
 */
import { type AnimationEvent, type JSX, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Wordmark } from '@/system/ui'
import { tuneIn } from '@/system/vfx'
import { bootThisLoad, finish } from './boot-state'
import './boot.css'

/** Both counted from the page request (performance.now()), so time spent loading the code counts too. */
const MIN_MS = 950
const MAX_MS = 2000
/** The least this component shows once it takes over: enough for the wordmark's slam and the count. */
const OWN_MS = 500

/** The key art decoded (or failed: the hero shows its own Signal lost then). */
function artReady(): Promise<void> {
  const img = document.querySelector<HTMLImageElement>('.pg-hero-art')
  if (!img || img.complete) return Promise.resolve()
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true })
    img.addEventListener('error', () => resolve(), { once: true })
  })
}

export function Boot(): JSX.Element | null {
  const [phase, setPhase] = useState<'off' | 'on' | 'out'>(() => (bootThisLoad() ? 'on' : 'off'))
  const [ch, setCh] = useState(1)
  // the HTML power-on already ran: carry on from it instead of switching the set on twice
  const [continued] = useState(() => document.documentElement.hasAttribute('data-preboot'))
  const canvas = useRef<HTMLCanvasElement>(null)

  // take over from index.html's first frames before this paints, so the two never show together
  useLayoutEffect(() => {
    document.getElementById('preboot')?.remove()
    document.documentElement.removeAttribute('data-preboot')
  }, [])

  useEffect(() => {
    if (phase !== 'on') return
    const start = performance.now()
    const hold = Math.max(OWN_MS, MIN_MS - start)
    const cancelStatic = canvas.current ? tuneIn(canvas.current, { ms: hold }) : () => {}
    const tick = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / (hold - 150))
      setCh(1 + Math.round(p * 26))
      if (p >= 1) window.clearInterval(tick)
    }, 40)
    let left = false
    const leave = (): void => {
      if (left) return
      left = true
      window.clearInterval(tick)
      setCh(27)
      setPhase('out')
    }
    const min = new Promise((resolve) => window.setTimeout(resolve, hold))
    void Promise.all([document.fonts.ready, artReady(), min]).then(leave)
    const cap = window.setTimeout(leave, Math.max(hold, MAX_MS - start))
    const skip = ['pointerdown', 'keydown', 'wheel', 'touchmove'] as const
    skip.forEach((type) => window.addEventListener(type, leave, { passive: true }))
    return () => {
      cancelStatic()
      window.clearInterval(tick)
      window.clearTimeout(cap)
      skip.forEach((type) => window.removeEventListener(type, leave))
    }
  }, [phase])

  // the hero's tune-in starts as the wipe begins, so the screen it reveals is already in static; the boot leaves
  // the tree when the wipe ends (a timer covers a browser that drops the animation event)
  useEffect(() => {
    if (phase !== 'out') return
    finish()
    const id = window.setTimeout(() => setPhase('off'), 900)
    return () => window.clearTimeout(id)
  }, [phase])

  const onAnimationEnd = (e: AnimationEvent<HTMLDivElement>): void => {
    if (e.animationName === 'pg-boot-out') setPhase('off')
  }

  if (phase === 'off') return null
  const found = ch >= 27
  return (
    <div className="pg-boot" data-phase={phase} data-continued={continued || undefined} aria-hidden onAnimationEnd={onAnimationEnd}>
      <div className="pg-boot-screen">
        <canvas ref={canvas} className="pg-boot-static" />
        <div className="pg-boot-mark">
          <Wordmark />
        </div>
        <p className="pg-boot-line" data-found={found || undefined}>
          {/* taste-skill-ignore: a TV channel readout, not list numbering */}
          {found ? 'CH 27 · Signal found' : `Searching · CH ${String(ch).padStart(2, '0')}`}
        </p>
      </div>
    </div>
  )
}
