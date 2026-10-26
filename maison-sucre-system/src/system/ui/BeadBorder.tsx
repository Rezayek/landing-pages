import { useEffect, useRef, type JSX } from 'react'
import { cx } from '../feedback/internal'
import { play } from '../vfx'

export interface BeadBorderProps {
  variant?: 'full' | 'short' | 'shell'
  /** Pipe the row in on its first arrival in view (scroll reveal, section transitions). Off: it is simply there. */
  arrive?: boolean
  className?: string
}

/**
 * The bead border (FOUNDATIONS.md §10): a row of piped dots that closes a group, in place of a hairline. On its first
 * arrival in view the row is piped in left to right, once ('bead', MOTION-SYSTEM.md: scroll reveal and section
 * transitions). Content is never hidden waiting for it. Decorative: hidden from assistive technology.
 */
export function BeadBorder({ variant = 'full', arrive = true, className }: BeadBorderProps): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !arrive || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void play(el, 'bead')
          io.disconnect()
        }
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [arrive])
  return <span ref={ref} className={cx('ms-beads', className)} data-variant={variant} aria-hidden="true" />
}
