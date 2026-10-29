/**
 * HALO's one-shot effects, the script half of halo.css: sheen, settle, rise, detent.
 *
 *   playHalo(el, 'sheen')   a light sweep across el, once (success, a finish revealed)
 *   playHalo(el, 'settle')  the product lands on its stage after a build change
 *   playHalo(el, 'rise')    the hero watch rises into its shadow, once per load
 *   playHalo(el, 'detent')  the dial's index dips as it steps
 *
 * The caller sets the state first (the label, the frame, the value); the effect only decorates it. Under reduced
 * motion every one resolves at once and nothing plays. Calling again restarts; nothing queues or repeats.
 */
import { reducedMotion } from './vfx'

export type HaloShot = 'sheen' | 'settle' | 'rise' | 'detent'

const LIMIT_MS: Record<HaloShot, number> = { sheen: 1100, settle: 1100, rise: 1400, detent: 300 }

export function playHalo(el: HTMLElement | null, effect: HaloShot): Promise<void> {
  if (!el || reducedMotion()) return Promise.resolve()
  delete el.dataset.vfxPlay
  void el.offsetWidth // restart when the same effect plays twice in a row
  el.dataset.vfxPlay = effect
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
      if (event.animationName.startsWith('halo-')) finish()
    }
    el.addEventListener('animationend', onEnd)
    window.setTimeout(finish, LIMIT_MS[effect])
  })
}
