/**
 * The rest beat (UX.md, after the story): one statement in big type on the system's band, a chapter change after the
 * product. A pen line draws under "a yes or a no" as the band scrolls in (CSS scroll-driven, where supported); without
 * support or under reduced motion the line is simply drawn (MOTION.md).
 */
import type { JSX } from 'react'

export function RestBeat(): JSX.Element {
  return (
    <section className="fl-rest" data-moment="rest" aria-label="Every payment has a name">
      <p className="fl-rest__line">
        Every payment has a name against it, and every request gets{' '}
        <span className="fl-ink fl-ink--band">
          a yes or a no.
          <svg className="fl-ink__line fl-ink__line--scroll" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M4 14 C 70 6, 140 20, 200 11 S 276 10, 296 15" pathLength={1} />
          </svg>
        </span>
      </p>
      <a className="fl-rest__cta" href="#join">
        Join the waitlist
      </a>
    </section>
  )
}
