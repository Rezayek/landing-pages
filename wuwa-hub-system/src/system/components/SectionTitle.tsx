import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react'
import { useInDemo } from './scope'

/**
 * A section title with the gold-start rule (FOUNDATIONS.md §10). The title is written in sentence case and set in
 * caps by CSS. With `draw`, the gold start draws once (ea-draw) the first time the title enters the view; the
 * content is visible at first paint whatever happens.
 */
export function SectionTitle({
  children,
  level = 2,
  aside,
  id,
  draw = true,
}: {
  children: ReactNode
  level?: 1 | 2 | 3
  aside?: ReactNode
  id?: string
  draw?: boolean
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(!draw)
  useEffect(() => {
    if (seen || !ref.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true)
        observer.disconnect()
      }
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [seen])
  // Inside a /system demo card (whose own title is an h3) every section title is an h4; the look keeps its level.
  const inDemo = useInDemo()
  const Heading = inDemo ? 'h4' : (`h${level}` as const)
  return (
    <div ref={ref} className="ea-title" data-level={level}>
      <div className="ea-title__row">
        <Heading id={id} className="ea-title__text">
          {children}
        </Heading>
        {aside ? <span className="ea-title__aside">{aside}</span> : null}
      </div>
      <span className="ea-rule" aria-hidden="true">
        <i className={seen && draw ? 'ea-draw' : undefined} />
      </span>
    </div>
  )
}
