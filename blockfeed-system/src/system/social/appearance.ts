import { useSyncExternalStore } from 'react'

/**
 * The person's appearance settings live on <html> as data attributes, so the tokens answer to them with no JavaScript in
 * between. This file is the one place that reads and writes them. Choices are remembered in localStorage when it works
 * and the interface behaves the same when it does not.
 */
export type Theme = 'system' | 'light' | 'dark'
export type Scale = '2' | '3'
export type Contrast = 'normal' | 'more'
export type Motion = 'full' | 'reduced'

export interface Appearance {
  readonly theme: Theme
  readonly scale: Scale
  readonly contrast: Contrast
  readonly motion: Motion
}

const KEY = 'blockfeed:appearance'
const listeners = new Set<() => void>()

const read = (name: string): string | undefined => document.documentElement.dataset[name]

function snapshot(): Appearance {
  const theme = read('theme')
  return {
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    scale: read('scale') === '3' ? '3' : '2',
    contrast: read('contrast') === 'more' ? 'more' : 'normal',
    motion: read('motion') === 'reduced' ? 'reduced' : 'full',
  }
}

let cached = snapshot()

/** Same object while nothing changed, so React sees a stable snapshot. */
function current(): Appearance {
  const next = snapshot()
  if (next.theme === cached.theme && next.scale === cached.scale && next.contrast === cached.contrast && next.motion === cached.motion) return cached
  cached = next
  return cached
}

function emit(): void {
  current()
  listeners.forEach((l) => l())
}

/** Apply a change to <html> and remember it. */
export function setAppearance(change: Partial<Appearance>): void {
  const root = document.documentElement
  if (change.theme !== undefined) {
    if (change.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = change.theme
  }
  if (change.scale !== undefined) root.dataset.scale = change.scale
  if (change.contrast !== undefined) {
    if (change.contrast === 'more') root.dataset.contrast = 'more'
    else delete root.dataset.contrast
  }
  if (change.motion !== undefined) {
    if (change.motion === 'reduced') root.dataset.motion = 'reduced'
    else delete root.dataset.motion
  }
  emit()
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot()))
  } catch {
    // storage can be blocked: the settings still apply for this visit
  }
}

/** Restore what was saved. Called once at start. */
export function restoreAppearance(): void {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) setAppearance(JSON.parse(raw) as Partial<Appearance>)
  } catch {
    // nothing saved, or storage is blocked
  }
}

/** Anything that sets the attributes on <html> (the /system toolbar, a test) reaches the subscribers too. */
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const observer = new MutationObserver(() => listener())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-scale', 'data-contrast', 'data-motion'] })
  return () => {
    listeners.delete(listener)
    observer.disconnect()
  }
}

/** The current settings, kept in step with <html>. */
export function useAppearance(): Appearance {
  return useSyncExternalStore(subscribe, current, current)
}
