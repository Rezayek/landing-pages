/**
 * The boot's state, shared by the boot and the hero (Boot.tsx): whether this load opens with it, and who waits for it
 * to wipe off.
 */
import { prefersReducedMotion } from '@/system/motion'

const BOOTED_KEY = 'signalcon:booted'
let decided: boolean | null = null
let running = false
let played = false
const waiting = new Set<() => void>()

/** Whether this page load opens with the boot: decided once, so the boot and the hero agree. */
export function bootThisLoad(): boolean {
  if (decided != null) return decided
  let seen = false
  try {
    seen = sessionStorage.getItem(BOOTED_KEY) === '1'
  } catch {
    /* no storage: boot every load */
  }
  let reducedHere = false
  try {
    // the footer's Reduce motion switch, read here because the page restores it after this is decided
    reducedHere = localStorage.getItem('signalcon:motion') === 'reduced'
  } catch {
    /* the system setting still applies */
  }
  // ?boot=off skips it (captures); ?boot=on replays it in a session that has seen it
  const param = new URLSearchParams(window.location.search).get('boot')
  decided = (!seen || param === 'on') && param !== 'off' && !reducedHere && !prefersReducedMotion()
  running = decided
  return decided
}

/** Runs `fn` once the boot has wiped off (at once when there is none). Returns a cancel. */
export function afterBoot(fn: () => void): () => void {
  if (!bootThisLoad() || !running) {
    fn()
    return () => {}
  }
  waiting.add(fn)
  return () => waiting.delete(fn)
}

/** True once a boot has played on this load: the hero then starts on CH 27, the boot having searched for it. */
export function bootPlayed(): boolean {
  return played
}

export function finish(): void {
  if (!running) return
  running = false
  played = true
  try {
    sessionStorage.setItem(BOOTED_KEY, '1')
  } catch {
    /* boots again next load */
  }
  for (const fn of waiting) fn()
  waiting.clear()
}
