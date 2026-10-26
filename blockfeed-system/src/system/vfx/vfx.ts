/**
 * Blockfeed's effects, the script half (the CSS half is vfx.css). MOTION-SYSTEM.md §Theme expression says where
 * each one is used; every one moves in whole pixel units and stepped frames.
 *
 *   play(el, name)         one-shot on a host: glint, scan, pop, shake, pulse, wipe, flicker
 *   pickup(from, to)       a copy of the icon hops in an arc to where the thing is kept (a like, a save, a follow)
 *   xp(from, to)           experience orbs spill out and home into a bar or counter (a vote counted, progress earned)
 *   burst(el)              square debris from the element's centre, rare moments only (a milestone)
 *   decode(el, text)       text resolves from random glyphs to its final value (the real text is announced at once)
 *   reducedMotion()        the system setting or the in-app switch (<html data-motion="reduced">)
 *
 * Every function is a no-op or an instant result under reduced motion, never repeats by itself, and never carries
 * the state alone: the label, colour or icon that says what happened is set by the caller before the effect plays.
 */

export type OneShot = 'glint' | 'scan' | 'pop' | 'shake' | 'pulse' | 'wipe' | 'flicker'

/** One-shots that stay meaningful as a still or a fade under reduced motion; the rest are skipped. */
const KEPT_WHEN_REDUCED: ReadonlySet<OneShot> = new Set(['wipe'])

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

/** One pixel unit in CSS px (2, or 3 at GUI scale 3): everything that flies snaps to it. */
function unit(): number {
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 2
}

function token(name: string, fallback: number): number {
  return msOf(getComputedStyle(document.documentElement).getPropertyValue(name), fallback)
}

const snap = (v: number, u: number): number => Math.round(v / u) * u

/** Plays a one-shot on `el` and resolves when it ends. Calling it again restarts the effect; it never queues. */
export function play(el: HTMLElement | null, effect: OneShot, options: { duration?: number } = {}): Promise<void> {
  if (!el) return Promise.resolve()
  if (reducedMotion() && !KEPT_WHEN_REDUCED.has(effect)) return Promise.resolve()
  if (!el.hasAttribute('data-vfx')) el.setAttribute('data-vfx', '')
  if (options.duration) el.style.setProperty('--vfx-dur', `${options.duration}ms`)
  delete el.dataset.vfxPlay
  void el.offsetWidth // restart the animation when the same effect plays twice in a row
  el.dataset.vfxPlay = effect
  const limit = (options.duration ?? Math.max(600, msOf(getComputedStyle(el).getPropertyValue('--vfx-dur'), 400))) + 150
  return new Promise((resolve) => {
    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      el.removeEventListener('animationend', onEnd)
      if (el.dataset.vfxPlay === effect) delete el.dataset.vfxPlay
      resolve()
    }
    const onEnd = (event: AnimationEvent): void => {
      if (event.animationName.startsWith('vfx-')) finish()
    }
    el.addEventListener('animationend', onEnd)
    window.setTimeout(finish, limit)
  })
}

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+<>/'

/**
 * Resolves `text` into `el` from random glyphs, left to right, over `duration` ms. Screen readers get the final
 * text at once through a visually hidden copy; the moving glyphs are aria-hidden.
 */
export function decode(
  el: HTMLElement | null,
  text: string,
  options: { duration?: number; glyphs?: string } = {},
): Promise<void> {
  if (!el) return Promise.resolve()
  if (reducedMotion()) {
    el.textContent = text
    return Promise.resolve()
  }
  const duration = options.duration ?? 600
  const glyphs = options.glyphs ?? GLYPHS
  const real = document.createElement('span')
  real.className = 'vfx-sr'
  real.textContent = text
  const shown = document.createElement('span')
  shown.setAttribute('aria-hidden', 'true')
  el.replaceChildren(real, shown)
  const start = performance.now()
  return new Promise((resolve) => {
    let done = false
    const finish = (): void => {
      if (done) return
      done = true
      el.textContent = text
      resolve()
    }
    const frame = (now: number): void => {
      if (done) return
      const t = Math.min(1, (now - start) / duration)
      const settled = Math.floor(t * text.length)
      let out = text.slice(0, settled)
      for (let i = settled; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)]
      }
      shown.textContent = out
      if (t < 1) requestAnimationFrame(frame)
      else finish()
    }
    requestAnimationFrame(frame)
    // Frames pause in a hidden tab: the text still lands on time.
    window.setTimeout(finish, duration + 100)
  })
}

/**
 * Flies `sprite` through `points` one frame per point (no tween between them), then removes it. Resolves on landing.
 */
function fly(sprite: HTMLElement, points: readonly [number, number][], duration: number, delay = 0): Promise<void> {
  sprite.classList.add('vfx-fly')
  sprite.setAttribute('aria-hidden', 'true')
  document.body.append(sprite)
  const frames = points.map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)`, easing: 'steps(1, end)' }))
  const run = sprite.animate(frames, { duration, delay, fill: 'both' })
  const remove = (): void => sprite.remove()
  // Frames pause in a hidden tab: the sprite never outlives its flight.
  window.setTimeout(remove, delay + duration + 100)
  return run.finished.then(remove, remove)
}

/** Points on a hop from (x0, y0) to (x1, y1) that rises `lift` px, snapped to the unit grid, `count` frames long. */
function arc(x0: number, y0: number, x1: number, y1: number, lift: number, count: number, u: number): [number, number][] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const t = i / count
    return [snap(x0 + (x1 - x0) * t, u), snap(y0 + (y1 - y0) * t - lift * 4 * t * (1 - t), u)] as [number, number]
  })
}

/**
 * pickup: a copy of `from` (usually its icon) hops in an arc into `to`, where the thing is now kept (the saved
 * builds, the like count, the following list), and `to` pops as it lands. The state is already set by the caller.
 */
export function pickup(from: HTMLElement | null, to: HTMLElement | null): Promise<void> {
  if (!from || !to || reducedMotion()) return Promise.resolve()
  const u = unit()
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const sprite = from.cloneNode(true) as HTMLElement
  sprite.removeAttribute('id')
  sprite.style.inlineSize = `${a.width}px`
  sprite.style.blockSize = `${a.height}px`
  sprite.style.margin = '0'
  const x1 = b.left + b.width / 2 - a.width / 2
  const y1 = b.top + b.height / 2 - a.height / 2
  const points = arc(a.left, a.top, x1, y1, Math.max(u * 12, Math.abs(y1 - a.top) / 3), 8, u)
  return fly(sprite, points, token('--dur-pickup', 400)).then(() => play(to, 'pop'))
}

/**
 * xp: `count` experience orbs spill out of `from` and home into `to` (a bar, a vote count), the last one landing as
 * `onArrive` runs. The caller moves the bar or the number itself; the orbs only say where the gain went.
 */
export function xp(from: HTMLElement | null, to: HTMLElement | null, options: { count?: number; onArrive?: () => void } = {}): Promise<void> {
  if (!from || !to || reducedMotion()) {
    options.onArrive?.()
    return Promise.resolve()
  }
  const u = unit()
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const count = Math.min(options.count ?? 5, 8)
  const duration = token('--dur-pickup', 400)
  const flights = Array.from({ length: count }, (_, i) => {
    const orb = document.createElement('span')
    orb.className = 'vfx-orb'
    const x0 = a.left + a.width / 2
    const y0 = a.top + a.height / 2
    // spill: a short hop outward, then home into the target in the same flight
    const spill = (i / count) * Math.PI * 2
    const mx = x0 + Math.cos(spill) * u * 10
    const my = y0 + Math.sin(spill) * u * 6 - u * 6
    const x1 = b.left + b.width * (0.2 + (0.6 * i) / Math.max(1, count - 1))
    const y1 = b.top + b.height / 2
    const out = arc(x0, y0, mx, my, u * 4, 3, u)
    const home = arc(mx, my, x1, y1, u * 8, 6, u).slice(1)
    return fly(orb, [...out, ...home], duration, i * 40)
  })
  return Promise.all(flights).then(() => {
    options.onArrive?.()
  })
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
}

/**
 * Square debris from the centre of `el`, for rare moments only (a challenge won, a first build posted): never on a
 * routine action. Draws on a fixed, pointer-transparent canvas that removes itself; every square snaps to the grid.
 */
export function burst(
  el: HTMLElement | null,
  options: { count?: number; spread?: number; duration?: number; colors?: readonly string[] } = {},
): void {
  if (!el || reducedMotion()) return
  const u = unit()
  const rect = el.getBoundingClientRect()
  const count = Math.min(options.count ?? 16, 40)
  const spread = options.spread ?? u * 28
  const duration = options.duration ?? token('--dur-4xl', 600)
  const style = getComputedStyle(el)
  const colors = options.colors ?? [
    style.getPropertyValue('--vfx-color').trim() || '#7fd13b',
    style.getPropertyValue('--vfx-color-2').trim() || '#55d6d6',
  ]
  const pad = spread * 2
  const canvas = document.createElement('canvas')
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  const width = rect.width + pad * 2
  const height = rect.height + pad * 2
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
  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
    const speed = spread * (0.6 + Math.random() * 0.6)
    return {
      x: width / 2,
      y: height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: u * (i % 3 === 0 ? 3 : 2),
      color: colors[i % colors.length],
    }
  })
  const start = performance.now()
  let last = start
  const frame = (now: number): void => {
    const t = Math.min(1, (now - start) / duration)
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    ctx.clearRect(0, 0, width, height)
    ctx.imageSmoothingEnabled = false
    for (const p of particles) {
      p.x += p.vx * dt * 2
      p.y += p.vy * dt * 2 + 60 * t * dt
      p.vx *= 0.94
      p.vy *= 0.94
      // no fade: each square shrinks a unit at a time, then is gone
      const size = Math.max(0, p.size - Math.floor(t * 3) * u)
      if (size === 0) continue
      ctx.fillStyle = p.color
      ctx.fillRect(snap(p.x, u), snap(p.y, u), size, size)
    }
    if (t < 1 && canvas.isConnected) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
  // Frames pause in a hidden tab: the canvas never outlives its burst.
  window.setTimeout(() => canvas.remove(), duration + 100)
}
