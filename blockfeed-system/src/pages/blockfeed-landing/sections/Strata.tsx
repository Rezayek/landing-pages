import { useEffect, useRef, type JSX } from 'react'
import { play } from '@/system/vfx'

export type Layer = 'grass' | 'dirt' | 'stone' | 'deep' | 'bedrock'

/**
 * The band of blocks between two Y-levels of the descent. Decorative (aria-hidden); it reveals once in six column
 * steps (the system `wipe`) as it scrolls into view. Content around it never moves; under reduced motion play() keeps
 * wipe as a short fade.
 */
export function Strata({ layer }: { layer: Layer }): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()
        void play(el, 'wipe')
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <span ref={ref} className="bl-strata" data-layer={layer} aria-hidden="true" />
}
