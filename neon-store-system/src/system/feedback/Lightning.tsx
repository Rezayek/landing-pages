import { useEffect, useRef, type JSX } from 'react'
import { prefersReducedMotion } from '../motion'

/**
 * Procedural lightning for the action button (MOTION-SYSTEM.md, "Cyberpunk VFX", v4; asked for by the person).
 * Every strike is a new bolt: a jagged main channel made by midpoint displacement, forks that split again, a width
 * that tapers and wavers along every channel, drawn in three passes of light (a wide soft glow, a mid channel, a white-hot core) that decay in a few frames.
 *   - `mode="arc"` (pending): strikes arc across the face at random gaps, never more than 2.5 a second (WCAG 2.3.1
 *     allows 3, and over a far larger area than a button).
 *   - `mode="strike"` (success): one full-width strike with a brief afterglow, then nothing.
 * The canvas sits under the label inside the cut face, so layout never moves. It draws nothing under reduced motion
 * or forced colours, and stops its animation frame loop the moment it is idle.
 * Colours come from the roles: the glow is `--focus` (the system's electric cyan), the core is near-white.
 */
type Point = readonly [number, number]

function bolt(from: Point, to: Point, roughness: number, depth: number): Point[] {
  if (depth === 0) return [from, to]
  const mid: Point = [
    (from[0] + to[0]) / 2 + (Math.random() - 0.5) * roughness * 0.4,
    (from[1] + to[1]) / 2 + (Math.random() - 0.5) * roughness,
  ]
  return [...bolt(from, mid, roughness / 2, depth - 1).slice(0, -1), ...bolt(mid, to, roughness / 2, depth - 1)]
}

/** One channel of a strike: its points, how heavy it is, and a width for each segment (fixed for the strike). */
interface Channel {
  points: Point[]
  widths: number[]
}

interface Strike {
  channels: Channel[]
  born: number
  life: number
}

/**
 * Real lightning is not a line of one weight: the leader is thick where it starts and thins toward its tip, its
 * width wavers segment by segment (pinches and swells), and each fork is thinner than the channel it leaves and
 * tapers to a hair. Widths are rolled once per strike, so a strike never shimmers while it lives.
 */
function channel(points: Point[], weight: number, taper: number): Channel {
  const n = points.length - 1
  const widths = Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(1, n - 1)
    const pinch = Math.random() < 0.12 ? 0.45 : 1 // an occasional pinch, like a channel narrowing
    return weight * Math.max(0.12, 1 - taper * t) * (0.65 + Math.random() * 0.7) * pinch
  })
  return { points, widths }
}

function makeStrike(w: number, h: number, full: boolean, now: number): Strike {
  const startX = full ? 0 : Math.random() * w * 0.3
  const endX = full ? w : w * (0.7 + Math.random() * 0.3)
  const main = bolt([startX, h * (0.3 + Math.random() * 0.4)], [endX, h * (0.3 + Math.random() * 0.4)], h * 1.4, 7)
  const channels = [channel(main, 1, 0.75)]
  const forks = full ? 3 : Math.random() < 0.7 ? 2 : 1
  for (let i = 0; i < forks; i++) {
    const from = Math.floor(main.length * (0.15 + Math.random() * 0.65))
    const at = main[from]
    const end: Point = [at[0] + (Math.random() * 0.3 + 0.08) * w, Math.random() < 0.5 ? h * 0.02 : h * 0.98]
    const fork = bolt(at, end, h * 0.7, 5)
    // A fork leaves at the width the channel has there, and thins to a hair.
    const weight = 0.55 * (1 - 0.75 * (from / main.length))
    channels.push(channel(fork, weight, 0.95))
    // Long forks split once more, thinner still.
    if (Math.random() < 0.5) {
      const sub = fork[Math.floor(fork.length * (0.3 + Math.random() * 0.4))]
      const subEnd: Point = [sub[0] + Math.random() * 0.15 * w, sub[1] + (Math.random() - 0.5) * h * 0.6]
      channels.push(channel(bolt(sub, subEnd, h * 0.4, 3), weight * 0.5, 1))
    }
  }
  return { channels, born: now, life: full ? 260 : 170 }
}

/** Relative luminance of an rgb() colour string, to pick a light or a dark bolt for the face it crosses. */
function luminance(colour: string): number {
  const m = colour.match(/\d+(\.\d+)?/g)
  if (!m) return 0
  const [r, g, b] = m.slice(0, 3).map((v) => {
    const c = Number(v) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** `strikeKey`: change it to fire one more strike in `strike` mode (the hover strike). */
export function Lightning({ mode, strikeKey = 0 }: { mode: 'off' | 'arc' | 'strike'; strikeKey?: number }): JSX.Element {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el || mode === 'off' || prefersReducedMotion() || matchMedia('(forced-colors: active)').matches) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const rect = el.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    el.width = Math.round(w * dpr)
    el.height = Math.round(h * dpr)
    ctx.scale(dpr, dpr)
    // Light the bolt against the face it crosses: a white-hot core with a cyan corona on a dark face; on a bright
    // face (the night volt button) an inverted arc, an ink core with a dark corona, which is how arcs read in glare.
    const host = el.parentElement ?? el
    const style = getComputedStyle(host)
    const ink = style.color
    const brightFace = luminance(ink) < 0.2
    const glow = brightFace ? ink : style.getPropertyValue('--focus').trim() || '#8cf0f7'
    const core = brightFace ? ink : '#f6fdff'
    let strikes: Strike[] = []
    let next = performance.now() + (mode === 'strike' ? 0 : 120)
    let frame = 0
    let done = false

    function draw(now: number): void {
      ctx!.clearRect(0, 0, w, h)
      if (!done && now >= next) {
        strikes.push(makeStrike(w, h, mode === 'strike', now))
        if (mode === 'strike') done = true
        // Gap to the next strike: 400-900 ms, so never more than 2.5 a second.
        else next = now + 400 + Math.random() * 500
      }
      strikes = strikes.filter((s) => now - s.born < s.life)
      for (const s of strikes) {
        const t = (now - s.born) / s.life
        // A strike flickers: full, a dip, a re-strike, then decay.
        const flicker = t < 0.15 ? 1 : t < 0.3 ? 0.4 : t < 0.45 ? 0.95 : Math.max(0, 1 - t) * 1.2
        // Three passes of light, each following the channel's own widths: corona, channel, core.
        // On a bright face the arc is a crisp dark crackle: a faint corona, no blur that would smear into a stroke.
        const passes = brightFace
          ? ([
              [5, 0.1, glow, 3],
              [2.2, 0.45, core, 0],
              [1.1, 0.95, core, 0],
            ] as const)
          : ([
              [11, 0.2, glow, 14],
              [4, 0.7, glow, 6],
              [1.9, 1, core, 2],
            ] as const)
        for (const [width, alpha, colour, blur] of passes) {
          ctx!.save()
          ctx!.globalAlpha = alpha * flicker
          ctx!.strokeStyle = colour
          ctx!.lineCap = 'round'
          ctx!.shadowColor = glow
          ctx!.shadowBlur = blur
          for (const ch of s.channels) {
            for (let i = 0; i < ch.widths.length; i++) {
              ctx!.lineWidth = Math.max(0.35, width * ch.widths[i])
              ctx!.beginPath()
              ctx!.moveTo(ch.points[i][0], ch.points[i][1])
              ctx!.lineTo(ch.points[i + 1][0], ch.points[i + 1][1])
              ctx!.stroke()
            }
          }
          ctx!.restore()
        }
      }
      if (done && strikes.length === 0) {
        ctx!.clearRect(0, 0, w, h)
        return
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      ctx.clearRect(0, 0, w, h)
    }
  }, [mode, strikeKey])

  return <canvas ref={canvas} className="fb-lightning" aria-hidden="true" />
}
