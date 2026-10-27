/**
 * "Your patch": the sound the visitor makes on this page, carried from the hero to the pre-order (CONCEPT: the patch
 * tag). The page starts on Night Bass. Loading a factory patch (S3) keeps a copy of what the visitor had, so "Back to
 * your patch" (UX A15) can restore it; turning any knob after that marks the tag "edited". The pre-order's "Patch on
 * slot 1" field starts from the tag's name.
 */
import { useSyncExternalStore } from 'react'
import { FACTORY_PATCHES, engine, type Patch } from '@/system/instrument'

interface YourPatch {
  /** the name on the tag, upper case, at most 16 characters */
  name: string
  /** the factory patch last loaded, or null */
  loadedId: string | null
  /** a knob moved since the last load */
  edited: boolean
  /** the visitor's own sound before they loaded a factory patch, for "Back to your patch" */
  saved: Patch | null
}

const FIRST = FACTORY_PATCHES[0]
let state: YourPatch = { name: FIRST.name.toUpperCase(), loadedId: FIRST.id, edited: false, saved: null }
const listeners = new Set<() => void>()
function set(next: Partial<YourPatch>): void {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void): (() => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export function useYourPatch(): YourPatch {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

let started = false
/** Puts the first patch on the engine once, and watches knob moves for the "edited" mark. */
export function startYourPatch(): void {
  if (started) return
  started = true
  engine.setPatch(FIRST.patch)
  let last = engine.getState().patch
  engine.subscribe(() => {
    const now = engine.getState().patch
    if (now !== last && !loading) set({ edited: true })
    last = now
  })
}

let loading = false
/** Loads a factory patch: keeps the visitor's sound the first time, so it can come back. */
export function loadFactory(id: string): void {
  const f = FACTORY_PATCHES.find((p) => p.id === id)
  if (!f) return
  const saved = state.saved ?? (state.edited ? engine.getState().patch : null)
  loading = true
  engine.setPatch(f.patch)
  loading = false
  set({ name: f.name.toUpperCase(), loadedId: f.id, edited: false, saved })
}

/** Brings back the visitor's own sound from before the first factory load. */
export function backToYours(): void {
  if (!state.saved) return
  loading = true
  engine.setPatch(state.saved)
  loading = false
  set({ name: 'YOUR PATCH', loadedId: null, edited: true, saved: null })
}

export function renameYourPatch(name: string): void {
  set({ name: name.toUpperCase().slice(0, 16) })
}
