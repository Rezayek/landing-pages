/**
 * Whether the page plays its scroll choreography (the hero's dive, the pinned story): a wide screen and no
 * reduced-motion preference. Phones and reduced motion get the stacked, still composition (MOTION.md).
 */
import { useSyncExternalStore } from 'react'
import { prefersReducedMotion, subscribeReducedMotion } from '@/system/motion'

const WIDE = '(min-width: 64rem)'

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(WIDE)
  query.addEventListener('change', listener)
  const stop = subscribeReducedMotion(listener)
  return () => {
    query.removeEventListener('change', listener)
    stop()
  }
}

const cinematic = (): boolean => window.matchMedia(WIDE).matches && !prefersReducedMotion()
const wide = (): boolean => window.matchMedia(WIDE).matches

export function useCinematic(): boolean {
  return useSyncExternalStore(subscribe, cinematic, () => false)
}

export function useWide(): boolean {
  return useSyncExternalStore(subscribe, wide, () => false)
}
