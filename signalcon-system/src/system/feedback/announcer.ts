import { useSyncExternalStore } from 'react'

/**
 * The one place status text is spoken to assistive technology. `announce()` can be called from anywhere (a hook, an
 * event handler, a store); the single mounted <LiveRegion /> renders what it says. Rules it applies:
 *  - two regions, polite (`role="status"`) and assertive (`role="alert"`), both mounted before any text arrives;
 *  - messages sent within a short window are combined, because screen readers often speak only the latest one;
 *  - an identical message is spoken again (the region is emptied first);
 *  - plain text only. Controls and rich content never go through a live region.
 * `document.ariaNotify` is deliberately not used: it duplicates what the regions say and a Permissions Policy can
 * block it without any error. See guides/interaction.md §Focus and announcements in the workflow skill.
 */
export type Politeness = 'polite' | 'assertive'

export interface Announcement {
  readonly id: number
  readonly politeness: Politeness
  readonly text: string
}

export interface Spoken {
  readonly polite: string
  readonly assertive: string
  /** The last few announcements, newest first. The /system page shows them so a sighted person can check. */
  readonly log: readonly Announcement[]
}

/** Messages inside this window (ms) are spoken as one. */
const COMBINE_MS = 120
/** Gap (ms) between emptying a region and filling it, so a repeated message is announced again. */
const REPEAT_GAP_MS = 60
const LOG_SIZE = 8

let spoken: Spoken = { polite: '', assertive: '', log: [] }
let sequence = 0
const listeners = new Set<() => void>()
const queued: Record<Politeness, string[]> = { polite: [], assertive: [] }
const timers: Partial<Record<Politeness, ReturnType<typeof setTimeout>>> = {}

function publish(next: Partial<Spoken>): void {
  spoken = { ...spoken, ...next }
  listeners.forEach((listener) => listener())
}

const sentence = (text: string): string => (/[.!?…]$/.test(text) ? text : `${text}.`)

function flush(politeness: Politeness): void {
  const messages = [...new Set(queued[politeness])]
  queued[politeness] = []
  if (!messages.length) return
  const text = messages.map(sentence).join(' ')
  publish({
    [politeness]: '',
    log: [{ id: ++sequence, politeness, text }, ...spoken.log].slice(0, LOG_SIZE),
  })
  setTimeout(() => publish({ [politeness]: text }), REPEAT_GAP_MS)
}

/**
 * Speak a message. `polite` waits for the reader to finish and suits results, counts and progress. `assertive`
 * interrupts and is for errors that need action only; never use it for success.
 */
export function announce(message: string, politeness: Politeness = 'polite'): void {
  const text = message.trim()
  if (!text) return
  queued[politeness].push(text)
  clearTimeout(timers[politeness])
  timers[politeness] = setTimeout(() => flush(politeness), COMBINE_MS)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = (): Spoken => spoken

/** What the live regions currently say, plus a short log. For <LiveRegion /> and the /system page. */
export function useAnnouncements(): Spoken {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
