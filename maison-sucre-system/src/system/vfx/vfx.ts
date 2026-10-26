/**
 * The script half of the "Piped" motion language (the CSS half is vfx.css; the situations that use each effect are
 * in MOTION-SYSTEM.md §Theme expression).
 *
 *   play(el, name)          one-shot on a host: pipe, bead, gild, glint, dust
 *   countTo(el, from, to)   a figure rolls to its new value in tabular figures (the price range)
 *   petals(el)              a short fall of sugar petals from the element, for the one milestone: a confirmed tasting
 *   reducedMotion()         the system setting or the in-app switch (<html data-motion="reduced">)
 *
 * Every function is a no-op or an instant result under reduced motion, never repeats by itself, and never carries
 * the state alone: the label, colour or icon that says what happened is set by the caller before the effect plays.
 */
import { durationMs, ease } from '../motion'

export type OneShot = 'pipe' | 'bead' | 'gild' | 'glint' | 'dust'

/** One-shots that keep a still or a short fade under reduced motion; CSS settles them, so play() still sets them. */
const KEPT_WHEN_REDUCED: ReadonlySet<OneShot> = new Set(['pipe', 'bead', 'gild', 'dust'])

export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function msOf(value: string, fallback: number): number {
  const v = value.trim()
  if (v.endsWith('ms')) return Number.parseFloat(v)
  if (v.endsWith('s')) return Number.parseFloat(v) * 1000
  return fallback
}

/** Plays a one-shot on `el` and resolves when it ends. Calling it again restarts the effect; it never queues. */
export function play(el: Element | null, effect: OneShot, options: { duration?: number } = {}): Promise<void> {
  if (!(el instanceof HTMLElement || el instanceof SVGElement)) return Promise.resolve()
  if (reducedMotion() && !KEPT_WHEN_REDUCED.has(effect)) return Promise.resolve()
  if (options.duration) el.style.setProperty('--vfx-dur', `${options.duration}ms`)
  delete el.dataset.vfxPlay
  void el.getBoundingClientRect() // restart the animation when the same effect plays twice in a row
  el.dataset.vfxPlay = effect
  const limit = (options.duration ?? msOf(getComputedStyle(el).getPropertyValue('--vfx-dur'), durationMs['2xl'])) + 700
  return new Promise((resolve) => {
    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      el.removeEventListener('animationend', onEnd)
      resolve()
    }
    const onEnd = (event: Event): void => {
      if ((event as AnimationEvent).animationName.startsWith('vfx-') && event.target === el) finish()
    }
    el.addEventListener('animationend', onEnd)
    window.setTimeout(finish, limit)
  })
}

/**
 * Rolls the number in `el` from `from` to `to` over `duration` ms with the enter curve, formatted by `format`. The
 * element must use tabular figures so nothing reflows. The final text is set at once for assistive technology.
 */
export function countTo(
  el: HTMLElement | null,
  from: number,
  to: number,
  format: (n: number) => string,
  options: { duration?: number } = {},
): () => void {
  if (!el) return () => {}
  const final = format(to)
  el.setAttribute('aria-label', final)
  if (reducedMotion() || from === to) {
    el.textContent = final
    return () => {}
  }
  const duration = options.duration ?? durationMs['3xl']
  const [, y1, , y2] = ease.enter
  // the enter curve (0, 0, 0, 1) is close to an exponential ease-out: sample it cheaply
  const curve = (t: number): number => 1 - (1 - t) ** (3 + y2 - y1)
  const start = performance.now()
  let raf = 0
  const frame = (now: number): void => {
    const t = Math.min(1, (now - start) / duration)
    el.textContent = format(Math.round(from + (to - from) * curve(t)))
    if (t < 1) raf = requestAnimationFrame(frame)
  }
  raf = requestAnimationFrame(frame)
  const timer = window.setTimeout(() => (el.textContent = final), duration + 100)
  return () => {
    cancelAnimationFrame(raf)
    window.clearTimeout(timer)
    el.textContent = final
  }
}

interface Petal {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  spin: number
  angle: number
  color: string
}

/**
 * Sugar petals fall from `el` for 1.2 s: the one milestone (a confirmed tasting). Never on a routine action. Draws
 * on a fixed, pointer-transparent canvas that removes itself; the colours are the petal dusts from the tokens.
 */
export function petals(el: HTMLElement | null, options: { count?: number } = {}): void {
  if (!el || reducedMotion()) return
  const rect = el.getBoundingClientRect()
  const style = getComputedStyle(document.documentElement)
  const colors = ['--petal-floral', '--petal-flavour', '--petal-modern', '--gold']
    .map((t) => style.getPropertyValue(t).trim())
    .filter(Boolean)
  const count = Math.min(options.count ?? 10, 28) // 0.3.0: calmer, a few petals (was 18)
  const duration = 1200
  const pad = 80
  const width = rect.width + pad * 2
  const height = rect.height + pad * 3
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    left: `${rect.left - pad}px`,
    top: `${rect.top - pad}px`,
    width: `${width}px`,
    height: `${height}px`,
    pointerEvents: 'none',
    zIndex: '2147483646',
  })
  document.body.append(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }
  ctx.scale(ratio, ratio)
  const list: Petal[] = Array.from({ length: count }, (_, i) => ({
    x: pad + Math.random() * rect.width,
    y: pad + Math.random() * rect.height * 0.4,
    vx: (Math.random() - 0.5) * 24,
    vy: 20 + Math.random() * 40,
    r: 4 + Math.random() * 4,
    spin: (Math.random() - 0.5) * 2.4,
    angle: Math.random() * Math.PI,
    color: colors[i % colors.length] || '#ebcbc7',
  }))
  const start = performance.now()
  let last = start
  const frame = (now: number): void => {
    const t = Math.min(1, (now - start) / duration)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    ctx.clearRect(0, 0, width, height)
    ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3
    for (const p of list) {
      p.x += (p.vx + Math.sin(now / 300 + p.r) * 8) * dt
      p.y += p.vy * dt
      p.vy += 60 * dt
      p.angle += p.spin * dt
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    if (t < 1 && canvas.isConnected) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
  window.setTimeout(() => canvas.remove(), duration + 100) // frames pause in a hidden tab
}
