/**
 * The film player (MOTION-SYSTEM.md §Patterns, scroll film, 0.4.0): a rendered camera journey scrubbed by scroll.
 * guides/three-d.md §Rendered film is the contract:
 * - the poster `<picture>` (desktop and phone sources) is the first paint and the LCP; the canvas fades in over it
 *   once it has drawn, in the same box and composition, so nothing moves;
 * - frames load after first paint: key frames first, then every 8th, then the rest, six requests at a time; the
 *   scrub always draws the nearest loaded frame, so it works at once and sharpens as frames arrive;
 * - GSAP ScrollTrigger maps the trigger element's scroll (top to bottom) to a frame; a small lerp smooths the index;
 * - reduced motion loads the key frames only and jumps between them, no scrub;
 * - a set with `stillsOnly` (phones on this project) shows its key frames as stills that cross-fade per chapter;
 * - a set with an `intro` (a short rendered pre-roll whose last frame is frame 0): a page opened at the top shows the
 *   camera arriving. The poster is the intro's first frame; once the intro is in, it plays once (about 1.6 s,
 *   ease-out) and hands to frame 0, then the scroll owns it. Not under reduced motion, not once the visitor scrolls.
 * Decorative: aria-hidden; the story is in the text over it.
 */
import { type JSX, type RefObject, useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion'
import './film.css'

export interface FilmSet {
  size: readonly [number, number]
  path: string
  stillsOnly?: boolean
  /** Which edge of the frame the crop holds when the screen is narrower than it: 0 the left edge (the right side is
   *  cropped, so the picture sits further right), 0.5 the centre (default), 1 the right edge. A film framed with its
   *  subject on the right of text keeps it clear of the text with 0. */
  focusX?: number
  /** The opening arrival: `frames` rendered frames at `path`, the last one framed as frame 0 of the film. */
  intro?: { frames: number; path: string }
}

export interface FilmSpec {
  frames: number
  keys: readonly { id: string; frame: number }[]
  sets: { desktop: FilmSet; phone: FilmSet }
  ext: string
  digits: number
}

export interface FilmPlayerProps {
  film: FilmSpec
  /** The tall element whose scroll drives the film (its top at the viewport top = frame 0, its bottom = last frame). */
  trigger: RefObject<HTMLElement | null>
  /** Called with the chapter index (the nearest key) as it changes. */
  onChapter?: (index: number) => void
  /** Poster sources: the first frame each set shows (the intro's first frame where a set has one). */
  poster: { desktop: string; phone: string }
}

const PHONE = '(orientation: portrait) and (max-width: 900px)'
const INTRO_MS = 1600
const name = (film: FilmSpec, frame: number): string => `${String(frame).padStart(film.digits, '0')}.${film.ext}`
const url = (set: FilmSet, film: FilmSpec, frame: number): string => `${set.path}${name(film, frame)}`

export function FilmPlayer({ film, trigger, onChapter, poster }: FilmPlayerProps): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE).matches)
  const [chapter, setChapter] = useState(0)
  const chapterRef = useRef(0)
  const onChapterRef = useRef(onChapter)
  useEffect(() => {
    onChapterRef.current = onChapter
  })

  useEffect(() => {
    const mq = window.matchMedia(PHONE)
    const on = (): void => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const set = phone ? film.sets.phone : film.sets.desktop
  const stills = !!set.stillsOnly
  const keyFrames = film.keys.map((k) => k.frame)

  useEffect(() => {
    let alive = true
    let cleanup = (): void => {}
    const reduce = prefersReducedMotion()
    const images: (HTMLImageElement | null)[] = new Array(film.frames).fill(null)
    const loaded = new Set<number>()
    let target = 0
    let current = 0
    let drawn = ''
    let raf = 0
    // the arrival: its frames, whether it is still to play (at the top, motion allowed), and when it started
    const introSpec = !stills && !reduce ? set.intro : undefined
    const intro: (HTMLImageElement | null)[] = new Array(introSpec?.frames ?? 0).fill(null)
    let introLeft = intro.length
    let introPending = false
    let introStart = 0

    const setChapterFrom = (frame: number): void => {
      let best = 0
      keyFrames.forEach((kf, i) => {
        if (Math.abs(kf - frame) < Math.abs(keyFrames[best] - frame)) best = i
      })
      if (best !== chapterRef.current) {
        chapterRef.current = best
        setChapter(best)
        onChapterRef.current?.(best)
      }
    }

    const paint = (img: HTMLImageElement, label: string): void => {
      const c = canvas.current
      const ctx = c?.getContext('2d')
      if (!c || !ctx || label === drawn) return
      const w = c.width
      const h = c.height
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * s
      const dh = img.naturalHeight * s
      ctx.drawImage(img, (w - dw) * (set.focusX ?? 0.5), (h - dh) / 2, dw, dh)
      drawn = label
      c.dataset.frame = label // the frame on screen, for captures and checks ("intro-3", "120")
      if (!ready) setReady(true)
    }

    const draw = (): void => {
      if (stills) return
      // the arrival still to play: hold its first frame (the poster's own picture) until it runs
      if (introPending && !introStart) {
        if (intro[0]) paint(intro[0], 'intro-0')
        return
      }
      let f = Math.round(current)
      if (reduce) f = keyFrames[chapterRef.current]
      // nearest loaded frame
      for (let d = 0; d < film.frames; d++) {
        for (const g of [f - d, f + d]) {
          const img = loaded.has(g) ? images[g] : null
          if (img) return paint(img, String(g))
        }
      }
    }

    const tick = (now: number): void => {
      if (introPending && introStart) {
        const t = Math.min(1, (now - introStart) / INTRO_MS)
        const ease = 1 - Math.pow(1 - t, 3) // ease-out: the camera arrives and slows onto the table
        const i = Math.round(ease * (intro.length - 1))
        const img = intro[i]
        if (img) paint(img, `intro-${i}`)
        if (t < 1) {
          raf = requestAnimationFrame(tick)
          return
        }
        introPending = false
        drawn = ''
      }
      current += (target - current) * 0.15
      if (Math.abs(target - current) < 0.02) current = target
      draw()
      raf = current === target ? 0 : requestAnimationFrame(tick)
    }

    const startIntro = (): void => {
      if (!introPending || introStart || introLeft > 0 || !loaded.has(0)) return
      introStart = performance.now()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(tick)
    }

    const resize = (): void => {
      const c = canvas.current
      if (!c) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const box = c.getBoundingClientRect()
      c.width = Math.round(box.width * ratio)
      c.height = Math.round(box.height * ratio)
      drawn = ''
      draw()
    }

    const load = (): void => {
      if (stills) return
      // the queue: the arrival first (when it will play), then the key frames, every 8th, the rest
      const order: { src: string; done: (img: HTMLImageElement) => void; fail?: () => void }[] = []
      const seen = new Set<number>()
      const add = (f: number): void => {
        if (f < 0 || f >= film.frames || seen.has(f)) return
        seen.add(f)
        order.push({
          src: url(set, film, f),
          done: (img) => {
            images[f] = img
            loaded.add(f)
            if (f === 0) startIntro()
            if (!introPending && (Math.abs(f - current) < 9 || drawn === '')) draw()
          },
        })
      }
      if (introPending && introSpec) {
        for (let i = 0; i < introSpec.frames; i++) {
          order.push({
            src: `${introSpec.path}${name(film, i)}`,
            done: (img) => {
              intro[i] = img
              introLeft -= 1
              if (i === 0) draw()
              startIntro()
            },
            // a missing arrival frame: skip the arrival, the film itself is the view
            fail: () => {
              introPending = false
              drawn = ''
              draw()
            },
          })
        }
      }
      keyFrames.forEach(add)
      if (!reduce) {
        for (let f = 0; f < film.frames; f += 8) add(f)
        for (let f = 0; f < film.frames; f++) add(f)
      }
      let i = 0
      const next = (): void => {
        if (!alive || i >= order.length) return
        const item = order[i++]
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          item.done(img)
          next()
        }
        img.onerror = () => {
          item.fail?.()
          next()
        }
        img.src = item.src
      }
      for (let k = 0; k < 6; k++) next()
    }

    // after first paint: the poster is the first view, everything here is extra
    const start = window.setTimeout(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (!alive || !trigger.current) return
      gsap.registerPlugin(ScrollTrigger)
      const st = ScrollTrigger.create({
        trigger: trigger.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          // the visitor's scroll takes over from the arrival wherever it is
          if (self.progress > 0) introPending = false
          target = self.progress * (film.frames - 1)
          setChapterFrom(target)
          if (reduce) {
            current = target
            draw()
          } else if (!raf) raf = requestAnimationFrame(tick)
        },
      })
      target = st.progress * (film.frames - 1)
      current = target
      introPending = intro.length > 0 && st.progress === 0
      setChapterFrom(target)
      resize()
      load()
      window.addEventListener('resize', resize)
      cleanup = () => {
        st.kill()
        window.removeEventListener('resize', resize)
      }
    }, 120)

    return () => {
      alive = false
      window.clearTimeout(start)
      cancelAnimationFrame(raf)
      cleanup()
    }
    // the set changes with the screen shape; the rest is stable for a page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, stills])

  return (
    <div className="ms-film" aria-hidden="true">
      <picture>
        <source media={PHONE} srcSet={poster.phone} width={film.sets.phone.size[0]} height={film.sets.phone.size[1]} />
        <img className="ms-film__poster" style={{ objectPosition: `${(set.focusX ?? 0.5) * 100}% 50%` }} src={poster.desktop} width={film.sets.desktop.size[0]} height={film.sets.desktop.size[1]} alt="" fetchPriority="high" decoding="async" />
      </picture>
      {stills ? (
        <div className="ms-film__stills">
          {keyFrames.map((f, i) => (
            <img key={f} src={url(set, film, f)} alt="" width={set.size[0]} height={set.size[1]} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" data-current={i === chapter || undefined} />
          ))}
        </div>
      ) : (
        <canvas ref={canvas} className="ms-film__canvas" data-ready={ready || undefined} />
      )}
    </div>
  )
}
