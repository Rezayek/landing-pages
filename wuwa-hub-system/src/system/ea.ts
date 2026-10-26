/**
 * Echo Atlas effects, the script half (the CSS half is ea.css). MOTION-SYSTEM.md §Theme expression says where each
 * one is used.
 *
 *   ripple(el, point?)   one resonance ring from the press point (or the centre) of `el`; primary actions and results
 *
 * Like the primitives in ./vfx, it is a no-op under reduced motion, never repeats by itself and never carries the
 * state alone: the label, icon or colour that says what happened is set by the caller.
 */
import { reducedMotion } from './vfx'

export function ripple(el: HTMLElement | null, point?: { x: number; y: number }): void {
  if (!el || reducedMotion()) return
  const rect = el.getBoundingClientRect()
  const ring = document.createElement('span')
  ring.className = 'ea-ripple'
  ring.setAttribute('aria-hidden', 'true')
  ring.style.left = `${point ? point.x - rect.left : rect.width / 2}px`
  ring.style.top = `${point ? point.y - rect.top : rect.height / 2}px`
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
  el.append(ring)
  ring.addEventListener('animationend', () => ring.remove(), { once: true })
  // Frames pause in a hidden tab: the ring never outlives its animation.
  window.setTimeout(() => ring.remove(), 1000)
}
