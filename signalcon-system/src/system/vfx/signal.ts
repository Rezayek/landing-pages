/**
 * The style's own effects, the script half (signal.css is the CSS half). See MOTION-SYSTEM.md §Theme expression.
 *
 *   armReveals(root)        arms every [data-slam] and [data-wipe] below the fold and plays each once as it enters
 *   flip(el)                the channel-change glitch on a host (static + RGB split, 240 ms); skipped when reduced
 *   tuneIn(canvas, onDone)  the hero's static, fading to the art over the tune time; skipped when reduced
 *
 * Nothing is hidden before JavaScript runs, nothing is armed that is already on screen, and every effect is
 * decoration over a state that is already set.
 */
import { prefersReducedMotion, signalMs } from '../motion'

/** Arms the slams and wipes under `root` that are below the fold, and plays each once when it scrolls in. */
export function armReveals(root: ParentNode): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {}
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-slam], [data-wipe]'))
  const fold = window.innerHeight
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        if (el.dataset.slam === 'armed') el.dataset.slam = 'in'
        if (el.dataset.wipe === 'armed') el.dataset.wipe = 'in'
        io.unobserve(el)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  )
  for (const el of els) {
    if (el.getBoundingClientRect().top < fold * 1.05) continue // on (or at the edge of) the screen at load: leave it at rest
    if (el.hasAttribute('data-slam')) el.dataset.slam = 'armed'
    if (el.hasAttribute('data-wipe')) el.dataset.wipe = 'armed'
    io.observe(el)
  }
  // printing or a full-page capture never leaves an armed element hidden
  const release = (): void => {
    for (const el of els) {
      if (el.dataset.slam === 'armed') el.dataset.slam = 'in'
      if (el.dataset.wipe === 'armed') el.dataset.wipe = 'in'
    }
  }
  window.addEventListener('beforeprint', release)
  return () => {
    io.disconnect()
    window.removeEventListener('beforeprint', release)
  }
}

/** Plays the channel-change glitch on `el` (restarts if it is already playing). Resolves when it ends. */
export function flip(el: HTMLElement | null): Promise<void> {
  if (!el || prefersReducedMotion()) return Promise.resolve()
  delete el.dataset.flipPlay
  void el.offsetWidth // restart when flipped twice in a row
  el.dataset.flipPlay = ''
  return new Promise((resolve) => {
    window.setTimeout(() => {
      delete el.dataset.flipPlay
      resolve()
    }, signalMs.flip + 20)
  })
}

/**
 * Draws TV static on a small canvas (scaled up with pixelated rendering) and fades it out over the tune time,
 * stepping the channel caption through `onStep`. Returns a cancel function. Under reduced motion it ends at once.
 */
export function tuneIn(
  canvas: HTMLCanvasElement,
  { onDone, ms = signalMs.tune }: { onDone?: () => void; ms?: number } = {},
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx || prefersReducedMotion()) {
    canvas.style.opacity = '0'
    onDone?.()
    return () => {}
  }
  const w = (canvas.width = 96)
  const h = (canvas.height = 72)
  const img = ctx.createImageData(w, h)
  const start = performance.now()
  let raf = 0
  let last = 0
  const draw = (t: number): void => {
    const p = Math.min(1, (t - start) / ms)
    if (t - last > 33) {
      // about 30 frames a second is enough for static and halves the work
      last = t
      const data = img.data
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    }
    // hold full static for the first third, then clear on an ease-in so the art "locks on"
    const fade = p < 0.35 ? 1 : 1 - ((p - 0.35) / 0.65) ** 2
    canvas.style.opacity = String(Math.max(0, fade))
    if (p < 1) raf = requestAnimationFrame(draw)
    else onDone?.()
  }
  raf = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(raf)
}
