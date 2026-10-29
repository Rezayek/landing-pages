import { useSyncExternalStore } from 'react'

/**
 * The toast store. `toast()` can be called from anywhere; <ToastRegion /> (mounted once) draws what is in here.
 *
 * Rules built in (guides/interaction.md §Notifications in the workflow skill):
 *  - A toast is for a result that is not visible where the person is, or an Undo, never the only place something
 *    is said. Errors belong inline first; a toast for a background failure stays until dismissed.
 *  - Auto-dismiss time grows with the message: 3 s plus 0.5 s a word, between 5 s and 10 s. A toast with an action
 *    or an error never auto-dismisses unless you pass `duration`. More than about 20 words is not a toast.
 *  - The same message and tone shown twice refreshes the first instead of stacking. Pass `id` to dedupe by key.
 *  - At most three are visible; the rest wait in order.
 */
export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** Dedupes: showing a toast with an existing id replaces it and restarts its timer. */
  id?: string
  tone?: ToastTone
  /** Undo or Retry. Must also exist somewhere in the page (a restore list, the item itself): a toast is gone soon. */
  action?: ToastAction
  /** A second, lesser action drawn after the first (Copy link after Undo). Also needs a home in the page. */
  secondaryAction?: ToastAction
  /** Milliseconds before it goes, or `null` to stay until dismissed. */
  duration?: number | null
}

export interface ToastItem {
  readonly id: string
  readonly message: string
  readonly tone: ToastTone
  readonly action?: ToastAction
  readonly secondaryAction?: ToastAction
  readonly durationMs: number | null
  /** Bumped when the same toast is shown again, so its timer restarts. */
  readonly revision: number
  readonly closing: boolean
}

const DURATION = { baseMs: 3000, perWordMs: 500, minMs: 5000, maxMs: 10000 } as const
/** Safety net: if the exit animation never reports back (animations off), the toast is removed after this. */
const REMOVE_AFTER_MS = 600

/** Default time on screen for a message. Derived from reading speed, not from a published standard. */
export function toastDuration(message: string): number {
  const words = message.trim().split(/\s+/).filter(Boolean).length
  return Math.min(DURATION.maxMs, Math.max(DURATION.minMs, DURATION.baseMs + DURATION.perWordMs * words))
}

let items: readonly ToastItem[] = []
const listeners = new Set<() => void>()

function publish(next: readonly ToastItem[]): void {
  items = next
  listeners.forEach((listener) => listener())
}

function show(message: string, options: ToastOptions = {}): string {
  const tone = options.tone ?? 'neutral'
  const id = options.id ?? `${tone}:${message}`
  const durationMs =
    options.duration !== undefined ? options.duration : options.action || tone === 'error' ? null : toastDuration(message)
  const existing = items.find((item) => item.id === id)
  const next: ToastItem = {
    id,
    message,
    tone,
    action: options.action,
    secondaryAction: options.secondaryAction,
    durationMs,
    revision: (existing?.revision ?? 0) + 1,
    closing: false,
  }
  publish(existing ? items.map((item) => (item.id === id ? next : item)) : [...items, next])
  return id
}

/** Start the exit. The region removes the toast when the exit animation ends. */
function dismiss(id: string): void {
  if (!items.some((item) => item.id === id && !item.closing)) return
  publish(items.map((item) => (item.id === id ? { ...item, closing: true } : item)))
  setTimeout(() => removeToast(id), REMOVE_AFTER_MS)
}

function clear(): void {
  items.forEach((item) => dismiss(item.id))
}

/** Show a toast. Returns its id. `toast.dismiss(id)` and `toast.clear()` close them. */
export const toast = Object.assign(show, { dismiss, clear })

/** Take a toast out of the store for good (the region calls this when its exit animation ends). */
export function removeToast(id: string): void {
  if (items.some((item) => item.id === id)) publish(items.filter((item) => item.id !== id))
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const snapshot = (): readonly ToastItem[] => items

/** The toasts in arrival order, oldest first. */
export function useToasts(): readonly ToastItem[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}
