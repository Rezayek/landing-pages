/** Header: wordmark, the six channels (desktop) or the Channels menu (phone), and the secondary Tickets pill. */
import { type JSX, useEffect, useState } from 'react'
import { ButtonLink, IconMenu, Mark, Sheet, Wordmark } from '@/system/ui'

export const CHANNELS = [
  { ch: 'CH01', label: "What's on", id: 'whats-on' },
  { ch: 'CH02', label: 'Guests', id: 'guests' },
  { ch: 'CH03', label: 'Schedule', id: 'schedule' },
  { ch: 'CH04', label: 'Tickets', id: 'tickets' },
  { ch: 'CH05', label: 'Venue', id: 'venue' },
  { ch: 'CH06', label: 'FAQ', id: 'faq' },
] as const

/** Moves focus to the section heading after an in-page jump (the anchor already scrolled). */
export function focusHeading(id: string): void {
  window.setTimeout(() => document.getElementById(id)?.focus({ preventScroll: true }), 0)
}

export function Header(): JSX.Element {
  const [current, setCurrent] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const sections = CHANNELS.map((c) => document.getElementById(`${c.id}-sec`)).filter((s): s is HTMLElement => !!s)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id.replace(/-sec$/, ''))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  return (
    <header className="pg-header">
      <div className="pg-header-row">
        <a href="#top" className="pg-brand" aria-label="SIGNAL//CON, back to top">
          <Mark size={30} />
          <Wordmark />
        </a>
        <nav aria-label="Channels" className="pg-nav">
          <ul>
            {CHANNELS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  aria-current={current === c.id ? 'location' : undefined}
                  onClick={() => focusHeading(c.id)}
                >
                  <span className="pg-nav-ch">{c.ch}</span>
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="pg-header-actions">
          <ButtonLink href="#tickets" variant="secondary" className="pg-header-tickets" onClick={() => focusHeading('tickets')}>
            Tickets
          </ButtonLink>
          <button
            type="button"
            className="pg-menu-btn sc-round sg-squash"
            aria-expanded={menu}
            aria-haspopup="dialog"
            aria-label="Channels"
            onClick={() => setMenu(true)}
          >
            <IconMenu size={22} />
          </button>
        </div>
      </div>
      <Sheet open={menu} onClose={() => setMenu(false)} title="Channels" full>
        <ul className="pg-menu-list">
          {CHANNELS.map((c, i) => (
            <li key={c.id} data-slam="in" style={{ '--slam-delay': `${i * 40}ms` } as React.CSSProperties}>
              <a
                href={`#${c.id}`}
                onClick={() => {
                  setMenu(false)
                  focusHeading(c.id)
                }}
              >
                <span className="pg-nav-ch">{c.ch}</span>
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </Sheet>
    </header>
  )
}
