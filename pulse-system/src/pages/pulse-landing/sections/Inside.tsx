/**
 * S2 Inside (UX.md S2, MOTION.md: the scroll story): the Blender-rendered PULSE-1 starts as a cloud of scattered parts
 * and assembles group by group as the visitor scrolls, in signal-path order (panel, board, keys, case), then closes
 * into the finished instrument (frames from film.json, scrubbed on a canvas over a poster). Each group's fact powers
 * on while it forms, with a small trace of that stage. Native sticky scroll drives it (no scroll library). Adjacent frames are
 * blended by the scroll's fraction, so the scrub is smooth between rendered frames. Callouts with leader lines follow the
 * parts of the active layer through the film (their positions are projected per frame in Blender: film-anchors.json),
 * through the same cover crop as the canvas. As the section arrives, the film opens from a horizontal line, the way the
 * hero's tube closes into one (MOTION.md: the S1 → S2 transition). The film fills the screen; the words sit over it. Frames load after
 * first paint when the section nears the view: key frames first, then every 8th, then the rest, a few at a time; the
 * nearest loaded frame is always drawn. Reduced motion: the key frames only, shown at their steps, no scrub. Without
 * JavaScript: the poster and the four facts.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import { Led } from '@/system/instrument'
import film from '../film.json'
import anchors from '../film-anchors.json'
import './inside.css'

const BASE = '/pulse-landing/'
type SetName = 'desktop' | 'phone'

const STEPS = [
  {
    key: 'panel',
    title: 'Panel · the controls',
    fact: 'Three big knobs, four envelope faders, twelve trims and 32 loop pads, engraved into the aluminium. Nothing hides in a menu.',
    trace: 'M0 30 L10 10 V30 L20 10 V30 L30 10 V30 L40 10 V30 L50 10 V30 L60 10 V30',
  },
  {
    key: 'board',
    title: 'Board · eight voices',
    fact: 'Eight voice cards, each with two oscillators, a sub and noise, then a resonant low-pass filter that sweeps from 40 Hz to 12 kHz. Analog-style: the controls and signal path follow classic analog design, running on a digital engine.',
    trace: 'M0 28 C4 6, 8 8, 10 24 C12 30, 16 30, 20 22 C24 6, 28 8, 30 24 C32 30, 36 30, 40 22 C44 6, 48 8, 50 24 C52 30, 56 30, 60 22',
  },
  {
    key: 'keys',
    title: 'Keys · the envelope',
    fact: 'Four octaves of keys, eight notes at once. Each press opens the envelope: how fast the note swells, how it settles, how long it holds, how it fades.',
    trace: 'M0 30 L6 4 L16 14 H44 L60 30',
  },
  {
    key: 'case',
    title: 'Case · the output',
    fact: 'Line out and headphones on 3.5 mm, MIDI in, USB-C for power, MIDI and audio. 2.4 kg, as wide as a laptop keyboard and a half.',
    trace: 'M0 18 C5 6, 10 6, 15 18 S25 30, 30 18 S40 6, 45 18 S55 30, 60 18',
  },
] as const

const frameUrl = (set: SetName, f: number): string => `${BASE}${film.sets[set].dir}/f${String(f).padStart(3, '0')}.webp`
const keyFrames = (): number[] => Object.values(film.keys)
const LANDED = STEPS.map((st) => (film.keys as Record<string, number>)[st.key])
/** the step on screen at a film position: a group's step runs while its parts fly in and holds a few frames past
 *  its landing (its callouts show then), so the text never names a group before its parts are moving */
function stepAt(pos: number): number {
  const hold = 12
  let s = 0
  for (let i = 0; i < LANDED.length - 1; i++) if (pos >= LANDED[i] + hold) s = i + 1
  return s
}

function useReduced(): boolean {
  const [r, setR] = useState(() => typeof window !== 'undefined' && (document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches))
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const read = (): void => setR(document.documentElement.dataset.motion === 'reduced' || mq.matches)
    mq.addEventListener('change', read)
    const mo = new MutationObserver(read)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
    return () => {
      mq.removeEventListener('change', read)
      mo.disconnect()
    }
  }, [])
  return r
}

export function Inside(): JSX.Element {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const list = useRef<HTMLOListElement>(null)
  const [step, setStep] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [failed, setFailed] = useState(false)
  // a retry runs the frame loader again from the start
  const [attempt, setAttempt] = useState(0)
  const [marks, setMarks] = useState<{ id: string; label: string; x: number; y: number; side: 1 | -1 }[]>([])
  const [open, setOpen] = useState(0)
  const reduced = useReduced()
  const total = film.frames

  // the open step's fact sits in one slot under the headings, as tall as the tallest fact (measured before paint,
  // again on resize), so a step opens in place and nothing around it moves
  useLayoutEffect(() => {
    const ol = list.current
    if (!ol) return
    const measure = (): void => {
      const items = [...ol.children] as HTMLElement[]
      const was = items.map((li) => li.hasAttribute('data-active'))
      let tallest = 0
      for (let i = 0; i < items.length; i++) {
        items.forEach((li, j) => li.toggleAttribute('data-active', i === j))
        tallest = Math.max(tallest, items[i].querySelector<HTMLElement>('.pl-inside__fact')?.offsetHeight ?? 0)
      }
      items.forEach((li, j) => li.toggleAttribute('data-active', was[j]))
      ol.style.setProperty('--fact-h', `${Math.ceil(tallest)}px`)
    }
    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(ol.parentElement ?? ol)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = root.current
    const c = canvas.current
    if (!el || !c) return
    const set: SetName = window.matchMedia('(max-aspect-ratio: 1/1), (max-width: 40rem)').matches ? 'phone' : 'desktop'
    const images: (HTMLImageElement | null)[] = new Array(total).fill(null)
    let current = -1
    let raf = 0
    let started = false
    let dead = false
    let errors = 0

    const nearest = (f: number): number => {
      for (let d = 0; d < total; d++) {
        if (images[f - d]?.complete) return f - d
        if (images[f + d]?.complete) return f + d
      }
      return -1
    }
    const [fw, fh] = film.sets[set].size
    const draw = (pos: number): void => {
      // the frames either side of the scroll position, blended by its fraction; the nearest loaded one stands in
      const f0 = Math.floor(pos)
      const frac = pos - f0
      const a = nearest(f0)
      if (a < 0) return
      const b = frac > 0.02 ? nearest(Math.min(total - 1, f0 + 1)) : a
      const key = a * 1000 + b + Math.round(frac * 20) / 100
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.round(c.clientWidth * dpr)
      const h = Math.round(c.clientHeight * dpr)
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
        current = -1
      }
      // object-fit: cover, kept for the callouts
      const sc = Math.max(w / fw, h / fh)
      const dw = fw * sc
      const dh = fh * sc
      const ox = (w - dw) / 2
      const oy = (h - dh) / 2
      if (key !== current) {
        current = key
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.globalAlpha = 1
        ctx.drawImage(images[a]!, ox, oy, dw, dh)
        if (b !== a && images[b]) {
          ctx.globalAlpha = frac
          ctx.drawImage(images[b]!, ox, oy, dw, dh)
          ctx.globalAlpha = 1
        }
        c.dataset.on = 'true'
      }
      // callouts for the active layer, interpolated between the two frames' projections
      const active = stepAt(pos)
      const layer = STEPS[active].key
      // a group's callouts show once its parts have landed
      // and go once the layers start closing into the finished instrument (the parts they name are then inside)
      const landed = pos >= LANDED[active] - 3 && pos <= film.keys.case + 4
      const side = list.current?.getBoundingClientRect()
      const keepOut = side && side.top < c.clientHeight * 0.5 ? side.left - 112 : Infinity
      const rows = anchors.sets[set] as ([number, number] | null)[][]
      const r0 = rows[f0]
      const r1 = rows[Math.min(total - 1, f0 + 1)]
      const next = anchors.anchors
        .map((an, i) => ({ an, p0: r0[i], p1: r1[i] }))
        .filter(({ an, p0 }) => landed && an.layer === layer && p0)
        .map(({ an, p0, p1 }) => {
          const x = (p0![0] + ((p1 ?? p0)![0] - p0![0]) * frac) * dw + ox
          const y = (p0![1] + ((p1 ?? p0)![1] - p0![1]) * frac) * dh + oy
          return { id: an.id, label: an.label, x: x / dpr, y: y / dpr }
        })
        // each label goes to the side where it fits the open film: inside the screen and clear of the words laid over
        // it (the steps beside it on a wide screen); a callout that fits neither side is left out
        .map((m) => {
          const right = Math.min(c.clientWidth, keepOut) - 8
          const reach = 72 + m.label.length * 8.6
          const fits = (side: 1 | -1): boolean => (side === 1 ? m.x + reach < right : m.x - reach > 8)
          const prefer: 1 | -1 = m.x > right / 2 ? -1 : 1
          const side = fits(prefer) ? prefer : fits((-prefer) as 1 | -1) ? ((-prefer) as 1 | -1) : 0
          return { ...m, side }
        })
        .filter((m): m is typeof m & { side: 1 | -1 } => m.side !== 0 && m.y > 56 && m.y < c.clientHeight - 8)
      setMarks(next)
    }

    const progress = (): number => {
      const box = el.getBoundingClientRect()
      const span = box.height - window.innerHeight
      return Math.min(1, Math.max(0, -box.top / Math.max(1, span)))
    }
    const onScroll = (): void => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const p = progress()
        const s = stepAt(p * (total - 1))
        setStep(s)
        const f = reduced ? LANDED[s] : p * (total - 1)
        draw(f)
        // the film opens from a line as the section comes up the screen (instant under reduced motion)
        const top = el.getBoundingClientRect().top
        setOpen(reduced ? 1 : Math.min(1, Math.max(0, 1 - top / (window.innerHeight * 0.85))))
      })
    }

    const load = (): void => {
      if (started) return
      started = true
      const keys = keyFrames()
      // key frames, then every 8th, then the even frames (enough for a smooth blended scrub), the odd ones last;
      // phones stop at the even frames
      const all = Array.from({ length: total }, (_, i) => i)
      const order = reduced ? keys : [...keys, ...all.filter((i) => i % 8 === 0 && !keys.includes(i)), ...all.filter((i) => i % 2 === 0 && i % 8 !== 0 && !keys.includes(i)), ...all.filter((i) => i % 2 === 1 && !keys.includes(i))]
      const phoneHalf = set === 'phone' && !reduced ? order.filter((i) => keys.includes(i) || i % 2 === 0) : order
      let next = 0
      let count = 0
      const pump = (): void => {
        if (dead || next >= phoneHalf.length) return
        const f = phoneHalf[next++]
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          images[f] = img
          count++
          setLoaded(Math.round((count / phoneHalf.length) * 100))
          onScroll()
          pump()
        }
        img.onerror = () => {
          errors++
          if (errors > 4) setFailed(true)
          pump()
        }
        img.src = frameUrl(set, f)
      }
      for (let i = 0; i < 6; i++) pump()
    }

    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && load(), { rootMargin: '150% 0px' })
    io.observe(el)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      dead = true
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced, total, attempt])

  return (
    <section id="inside" ref={root} aria-labelledby="inside-title" data-section="inside" data-story="explode" className="pl-inside">
      <div className="pl-inside__pin">
        <header className="pl-inside__head">
          <h2 id="inside-title">Put it together. Follow the sound.</h2>
          <p>Scroll to build PULSE-1, one stage of the sound at a time.</p>
        </header>
        <div className="pl-inside__stage" style={{ '--open': open } as CSSProperties} data-open={open >= 1 || undefined}>
          <picture>
            <source media="(max-aspect-ratio: 1/1), (max-width: 40rem)" srcSet={frameUrl('phone', 0)} />
            <img className="pl-inside__poster" src={frameUrl('desktop', 0)} width={1600} height={900} alt="The parts of PULSE-1 floating apart in the dark: knobs, chips, keys and panels lit amber." onError={(e) => e.currentTarget.toggleAttribute('data-broken', true)} />
          </picture>
          <canvas ref={canvas} className="pl-inside__canvas" aria-hidden="true" />
          <div className="pl-inside__marks" aria-hidden="true">
            {marks.map((m) => (
              <span key={m.id} className="pl-mark" data-side={m.side} style={{ left: m.x, top: m.y }}>
                <i className="pl-mark__dot" />
                <i className="pl-mark__line" />
                <span className="pl-mark__label pi-legend">{m.label}</span>
              </span>
            ))}
          </div>
          {loaded < 100 && !failed ? (
            <p className="pl-inside__loading" aria-hidden={loaded === 0}>
              <span style={{ inlineSize: `${loaded}%` }} />
              <span className="pi-legend">Loading the layers… {loaded} %</span>
            </p>
          ) : null}
          {failed ? (
            // the scope's own no-signal screen: a graticule and a flat trace, never a black void
            <div className="pl-inside__nosignal">
              <span className="pl-inside__flat" aria-hidden="true" />
              <div className="pl-inside__failed" role="status">
                <span className="pl-inside__fault">
                  <Led state="negative" /> <span className="pi-legend">No signal</span>
                </span>
                <span>The film didn't load. Each stage is still described here.</span>
                <button
                  type="button"
                  className="pi-quiet"
                  onClick={() => {
                    setFailed(false)
                    setLoaded(0)
                    setAttempt((n) => n + 1)
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <ol className="pl-inside__steps" ref={list}>
          {STEPS.map((s, i) => (
            <li key={s.key} data-active={step === i || undefined} aria-current={step === i ? 'step' : undefined}>
              <h3>
                <span className="pl-inside__n">{String(i + 1).padStart(2, '0')}</span> {s.title}
              </h3>
              <div className="pl-inside__fact">
                <p>{s.fact}</p>
                <svg className="pl-inside__trace" viewBox="0 0 60 34" aria-hidden="true">
                  <path d={s.trace} />
                </svg>
              </div>
            </li>
          ))}
        </ol>
        <p className="pl-inside__progress pi-legend" aria-hidden="true">
          Step {step + 1} of 4 · {STEPS[step].title.split(' · ')[0]}
        </p>
        <p className="pl-inside__note">Specs invented for this design study.</p>
      </div>
    </section>
  )
}
