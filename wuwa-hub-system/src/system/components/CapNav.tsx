/**
 * CapNav: the top bar's navigation with the resonance cap (COMPONENTS.md §Top bar navigation). One gold hairline runs
 * along the bar and lifts into a low, even arch over the current item; changing item glides the arch there; after a
 * click a Spectro glint passes along the arch's top once and three sparks rise (vfx `burst`). Hover shows a faint
 * arch. Under reduced motion the arch moves without travel and there is no glint or sparks.
 * Our own drawing, studied from the official site's nav cap (study, never copy).
 */
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import { burst, reducedMotion } from '../vfx'

export interface CapNavItem {
  readonly id: string
  readonly label: string
  readonly href: string
}

/** A shoulder (viewBox 12 × 34): an even S-curve from the hairline up to the arch's top. The end one is mirrored. */
const SHOULDER = 'M0 33.5 C6 33.5 6 0.5 12 0.5'
/** Room between the label and the arch's top corners, each side. */
const AIR = 6

export function CapNav({
  items,
  current,
  onNavigate,
  label = 'Sections',
}: {
  items: readonly CapNavItem[]
  current: string | null
  onNavigate?: (id: string) => void
  label?: string
}): JSX.Element {
  const listRef = useRef<HTMLUListElement>(null)
  const topRef = useRef<HTMLSpanElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [boxes, setBoxes] = useState<Record<string, { x: number; w: number }>>({})
  const [glint, setGlint] = useState(0)

  const measure = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const base = list.getBoundingClientRect().left
    const next: Record<string, { x: number; w: number }> = {}
    for (const a of list.querySelectorAll<HTMLElement>('[data-cap-id]')) {
      const r = a.getBoundingClientRect()
      next[a.dataset.capId!] = { x: r.left - base, w: r.width }
    }
    setBoxes(next)
  }, [])
  useLayoutEffect(() => {
    measure()
    const list = listRef.current
    if (!list) return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    void document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure, items])

  // the arch's top spans the label; its fixed shoulders sit outside it, so the arch caps the word and never crosses it
  const at = current ? boxes[current] : undefined
  const ghost = hover && hover !== current ? boxes[hover] : undefined
  // the arch's place goes only on the pieces that draw it, so a glide restyles them and never the links
  const spot = (b: { x: number; w: number } | undefined): CSSProperties | undefined =>
    b ? ({ '--cap-x': `${b.x - AIR}px`, '--cap-s': (b.w + 2 * AIR) / 100 } as CSSProperties) : undefined

  return (
    <nav className="ea-capnav" aria-label={label} data-current={at ? '' : undefined}>
      <span className="ea-capnav__strands" style={spot(at)} aria-hidden="true" />
      {ghost ? (
        <span className="ea-capnav__cap" data-ghost="" style={spot(ghost)} aria-hidden="true">
          <Arch />
        </span>
      ) : null}
      <span className="ea-capnav__cap" data-on={at ? '' : undefined} style={spot(at)} aria-hidden="true">
        <Arch topRef={topRef} />
        {glint ? <span key={glint} className="ea-capnav__glint" /> : null}
      </span>
      <ul ref={listRef} className="ea-capnav__list">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              data-cap-id={item.id}
              aria-current={item.id === current ? 'location' : undefined}
              onPointerEnter={() => setHover(item.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(item.id)}
              onBlur={() => setHover(null)}
              onClick={() => {
                onNavigate?.(item.id)
                if (reducedMotion()) return
                setGlint((n) => n + 1)
                // the sparks rise from the arch's top once the glide has landed on the new item
                const glide = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-tab')) || 240
                window.setTimeout(() => {
                  const top = topRef.current
                  const style = getComputedStyle(top ?? document.documentElement)
                  const colors = ['--band-accent', '--band-ink'].map((t) => style.getPropertyValue(t).trim())
                  burst(top, { count: 3, spread: 28, colors })
                }, glide)
              }}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Arch({ topRef }: { topRef?: React.Ref<HTMLSpanElement> }): JSX.Element {
  return (
    <>
      <svg className="ea-capnav__shoulder" data-side="start" viewBox="0 0 12 34" preserveAspectRatio="none">
        <path d={SHOULDER} vectorEffect="non-scaling-stroke" />
      </svg>
      <span ref={topRef} className="ea-capnav__top" />
      <svg className="ea-capnav__shoulder" data-side="end" viewBox="0 0 12 34" preserveAspectRatio="none">
        <path d={SHOULDER} vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  )
}
