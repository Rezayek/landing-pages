/**
 * Page footer (UX.md §Footer; BRIEF.md): the design-study sentence, the sample-data line, the section links, the cover
 * art credit and the logo. Fully opaque, above the street. Links are anchors that move focus to the section heading.
 */
import type { JSX, MouseEvent } from 'react'
import { Logo } from '@/system/components'
import { prefersReducedMotion } from '@/system/motion'
import { SNAPSHOT } from '../data'
import './closing.css'

const LINKS = [
  { id: 'deals', label: 'Deals' },
  { id: 'passes', label: 'Battle passes' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'questions', label: 'Questions' },
] as const

const behavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth')

function goTo(id: string, event: MouseEvent): void {
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ behavior: behavior(), block: 'start' })
  ;(document.getElementById(`${id}-title`) ?? target).focus({ preventScroll: true })
}

function toTop(event: MouseEvent): void {
  event.preventDefault()
  window.scrollTo({ top: 0, behavior: behavior() })
  document.getElementById('hero-title')?.focus({ preventScroll: true })
}

export function SiteFooter(): JSX.Element {
  return (
    <footer className="vl-footer">
      <div className="vl-wrap vl-footer__inner">
        {/* The logo is a link to the top; the wrapper catches its click so it scrolls like "Back to top". */}
        {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="vl-footer__brand" onClick={(e) => ((e.target as HTMLElement).closest('a') ? toTop(e) : undefined)}>
          <Logo href="#top" />
        </div>
        <div className="vl-footer__text">
          <p>VOLTCART is a design study. The store, games, prices and people are invented, and nothing here can be bought.</p>
          <p>
            Prices are sample data, checked {SNAPSHOT.date} at {SNAPSHOT.time}.
          </p>
          <p>Cover art: generated for this study.</p>
        </div>
        <nav aria-label="Footer" className="vl-footer__nav">
          <ul role="list">
            {LINKS.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} onClick={(e) => goTo(link.id, e)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#top" onClick={toTop}>
                Back to top
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
