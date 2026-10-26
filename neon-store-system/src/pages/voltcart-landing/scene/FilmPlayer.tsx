/**
 * The rendered street, scrubbed by the scroll: 240 frames of the Blender flight (blender/film.py), one camera key per
 * chapter, so the street reaches each chapter's view as that chapter comes up. Frames load in two passes (frame 1 and
 * every 8th, then the rest) and the nearest loaded frame paints, so a fast scroll never shows a gap. The canvas eases
 * toward the scroll position; paused, it follows the scroll exactly; hidden, it stops drawing. A scene event (a deal
 * picked, a code dispensed) glitches the street for a moment.
 */
import { useEffect, useRef, type JSX } from 'react'
import { sceneBus } from '../state'

const FRAMES = 240
/** The camera keys in film.py: hero, deals, passes, delivery, payment, questions, final. */
const KEYS = [1, 40, 80, 120, 160, 200, 240]
const EASE = 0.18

type FilmSet = 'desktop' | 'tablet' | 'phone'

function filmFrame(set: FilmSet, n: number): string {
  return `/voltcart-landing/film/${set}/f-${String(n).padStart(3, '0')}.webp`
}

/** Portrait screens get the portrait render (the same flight, framed tall); wide ones the 16:9 sets by pixel width. */
function filmSet(): FilmSet {
  if (typeof window === 'undefined') return 'desktop'
  if (window.innerHeight > window.innerWidth * 1.15) return 'phone'
  return window.innerWidth * Math.min(2, window.devicePixelRatio || 1) >= 1600 ? 'desktop' : 'tablet'
}

type Props = {
  paused: boolean
  active: boolean
  onReady: () => void
  onProgress: (percent: number) => void
  onGlitch: () => void
  onFail: () => void
}

export default function FilmPlayer({ paused, active, onReady, onProgress, onGlitch, onFail }: Props): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = useRef({ paused, active, onReady, onProgress, onGlitch, onFail })
  useEffect(() => {
    live.current = { paused, active, onReady, onProgress, onGlitch, onFail }
  })

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv?.getContext('2d', { alpha: false })
    if (!cv || !ctx) return
    const set = filmSet()
    const imgs: (HTMLImageElement | null)[] = new Array(FRAMES + 1).fill(null)
    let alive = true
    let dirty = true

    // Loading: frame 1 and every 8th first (the scrub has a frame near every position), then the rest.
    const first = [1]
    for (let n = 8; n <= FRAMES; n += 8) first.push(n)
    const order = [...first, ...Array.from({ length: FRAMES }, (_, i) => i + 1).filter((n) => !first.includes(n))]
    let cursor = 0
    let firstLoaded = 0
    let firstSettled = 0
    let readySent = false
    // When the first pass has settled and frames failed, the street stays on its poster: the tag goes away.
    const settleFirst = (): void => {
      firstSettled++
      if (firstSettled === first.length && !readySent) live.current.onFail()
    }
    const loadNext = (): void => {
      if (!alive || cursor >= order.length) return
      const n = order[cursor++]
      const im = new Image()
      im.decoding = 'async'
      im.src = filmFrame(set, n)
      const inFirst = first.includes(n)
      im.decode()
        .then(() => {
          if (!alive) return
          imgs[n] = im
          dirty = true
          if (inFirst) {
            firstLoaded++
            live.current.onProgress(Math.round((firstLoaded / first.length) * 100))
            if (!readySent && firstLoaded === first.length) {
              readySent = true
              live.current.onReady()
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (alive && inFirst) settleFirst()
          loadNext()
        })
    }
    for (let i = 0; i < 4; i++) loadNext()

    // Scroll -> frame: piecewise, each chapter's top maps to its camera key; the page end to the last key.
    let stops: [number, number][] = []
    const measure = (): void => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const chapters = Array.from(document.querySelectorAll<HTMLElement>('#main [data-chapter]'))
      if (chapters.length === KEYS.length) {
        stops = chapters.map((el, i) => [Math.min(max, el.getBoundingClientRect().top + window.scrollY), KEYS[i]])
        stops[0][0] = 0
        stops[stops.length - 1][0] = max
        for (let i = 1; i < stops.length; i++) stops[i][0] = Math.max(stops[i][0], stops[i - 1][0] + 1)
      } else {
        stops = [[0, 1], [max, FRAMES]]
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = Math.round(window.innerWidth * dpr)
      cv.height = Math.round(window.innerHeight * dpr)
      dirty = true
    }
    const target = (): number => {
      const y = window.scrollY
      for (let i = 1; i < stops.length; i++) {
        const [y0, f0] = stops[i - 1]
        const [y1, f1] = stops[i]
        if (y <= y1) return f0 + ((f1 - f0) * Math.max(0, y - y0)) / (y1 - y0)
      }
      return FRAMES
    }

    const draw = (n: number): boolean => {
      let im = imgs[n]
      for (let d = 1; !im && d < FRAMES; d++) im = imgs[n - d] ?? imgs[n + d] ?? null
      if (!im) return false
      const s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight)
      const w = im.naturalWidth * s
      const h = im.naturalHeight * s
      ctx.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h)
      return true
    }

    measure()
    let current = target()
    let shown = -1
    let raf = 0
    const tick = (): void => {
      raf = requestAnimationFrame(tick)
      if (!live.current.active) return
      const goal = target()
      current = live.current.paused ? goal : current + (goal - current) * EASE
      const n = Math.max(1, Math.min(FRAMES, Math.round(current)))
      if ((n !== shown || dirty) && draw(n)) {
        shown = n
        dirty = false
      }
    }
    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(measure)
    ro.observe(document.documentElement)
    window.addEventListener('resize', measure)
    const off = sceneBus.on(() => live.current.onGlitch())
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', measure)
      off()
    }
  }, [])

  return <canvas ref={canvas} />
}
