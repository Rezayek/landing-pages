/**
 * PULSE-1's own one-shots (the CSS half is pulse.css). Like play() in vfx.ts: the caller sets the state first (the
 * label, the colour, the LED), then the effect decorates it. Under reduced motion the effect is skipped or becomes
 * its still, and nothing ever repeats by itself.
 */
import { reducedMotion } from './vfx'

export type PulseShot = 'power-on' | 'type-on' | 'led-flash' | 'clip' | 'invert'

/** One-shots kept under reduced motion because they are colour only and carry state. */
const KEPT_WHEN_REDUCED: ReadonlySet<PulseShot> = new Set(['led-flash', 'clip', 'invert'])

function msOf(value: string, fallback: number): number {
  const v = value.trim()
  if (v.endsWith('ms')) return Number.parseFloat(v)
  if (v.endsWith('s')) return Number.parseFloat(v) * 1000
  return fallback
}

const DURATION_VAR: Record<PulseShot, string> = {
  'power-on': '--dur-power-on',
  'type-on': '--dur-type',
  'led-flash': '--dur-led',
  clip: '--dur-led',
  invert: '--dur-invert',
}

/** Plays one of PULSE-1's one-shots on `el`; calling again restarts it. Resolves when it ends. */
export function pulsePlay(el: HTMLElement | null, shot: PulseShot): Promise<void> {
  if (!el) return Promise.resolve()
  if (reducedMotion() && !KEPT_WHEN_REDUCED.has(shot)) return Promise.resolve()
  delete el.dataset.vfxPlay
  void el.offsetWidth
  el.dataset.vfxPlay = shot
  const base = msOf(getComputedStyle(el).getPropertyValue(DURATION_VAR[shot]), 400)
  const limit = (shot === 'led-flash' || shot === 'clip' ? base * 6 : base) + 120
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (el.dataset.vfxPlay === shot) delete el.dataset.vfxPlay
      resolve()
    }, limit)
  })
}

/**
 * Types `text` into `el` one character per step. The text is set at once (screen readers and copy get it whole);
 * only the reveal steps.
 */
export function typeOn(el: HTMLElement | null, text: string): Promise<void> {
  if (!el) return Promise.resolve()
  el.textContent = text
  el.style.setProperty('--type-chars', String(Math.max(1, text.length)))
  return pulsePlay(el, 'type-on')
}
