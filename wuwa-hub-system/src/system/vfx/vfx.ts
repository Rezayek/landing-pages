/**
 * Effect primitives, the script half (the CSS half is vfx.css). See guides/expression.md for how a style turns
 * these into its motion language, and MOTION-SYSTEM.md §Theme expression for where each one is used.
 *
 *   play(el, name)         one-shot on a host: sweep, scan, glitch, shake, pulse, wipe, flicker
 *   decode(el, text)       text resolves from random glyphs to its final value (the real text is announced at once)
 *   burst(el)              a short particle burst from the element's centre, on a throwaway canvas
 *   reducedMotion()        the system setting or the in-app switch (<html data-motion="reduced">)
 *
 * Every function is a no-op or an instant result under reduced motion, never repeats by itself, and never carries
 * the state alone: the label, colour or icon that says what happened is set by the caller before the effect plays.
 */

export type OneShot = 'sweep' | 'scan' | 'glitch' | 'shake' | 'pulse' | 'wipe' | 'flicker'

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

/** Plays a one-shot on `el` and resolves when it ends. Calling it again restarts the effect; it never queues. */
export function play(el: HTMLElement | null, effect: OneShot, options: { duration?: number } = {}): Promise<void> {
  if (!el) return Promise.resolve()
  if (reducedMotion() && !KEPT_WHEN_REDUCED.has(effect)) return Promise.resolve()
  if (!el.hasAttribute('data-vfx')) el.setAttribute('data-vfx', '')
  if (options.duration) el.style.setProperty('--vfx-dur', `${options.duration}ms`)
  delete el.dataset.vfxPlay
  void el.offsetWidth // restart the animation when the same effect plays twice in a row
  el.dataset.vfxPlay = effect
  const limit = (options.duration ?? msOf(getComputedStyle(el).getPropertyValue('--vfx-dur'), 400)) + 150
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

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
}

/**
 * A short burst of particles from the centre of `el`, for rare moments only (a milestone, a first purchase): never
 * on a routine action. Draws on a fixed, pointer-transparent canvas that removes itself.
 */
export function burst(
  el: HTMLElement | null,
  options: { count?: number; spread?: number; duration?: number; colors?: readonly string[] } = {},
): void {
  if (!el || reducedMotion()) return
  const rect = el.getBoundingClientRect()
  const count = Math.min(options.count ?? 16, 40)
  const spread = options.spread ?? 56
  const duration = options.duration ?? 600
  const style = getComputedStyle(el)
  const colors = options.colors ?? [
    style.getPropertyValue('--vfx-color').trim() || '#2f66e0',
    style.getPropertyValue('--vfx-color-2').trim() || '#00a3c4',
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
      size: 2 + Math.random() * 3,
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
    ctx.globalAlpha = 1 - t
    for (const p of particles) {
      p.x += p.vx * dt * 2
      p.y += p.vy * dt * 2 + 40 * t * dt
      p.vx *= 0.94
      p.vy *= 0.94
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.size, p.size)
    }
    if (t < 1 && canvas.isConnected) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
  // Frames pause in a hidden tab: the canvas never outlives its burst.
  window.setTimeout(() => canvas.remove(), duration + 100)
}
