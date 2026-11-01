/** Footer: the sign-off ("end of transmission"), the channel list, the study notice and the motion switch. */
import type { JSX } from 'react'
import { MotionSwitch, TestCard, Wordmark } from '@/system/ui'
import { NOTICE } from '../data'
import { CHANNELS, focusHeading } from './Header'

export function Footer(): JSX.Element {
  return (
    <footer className="pg-section pg-footer" data-band="paper" data-wipe="" style={{ '--wipe-color': 'var(--night-950)' } as React.CSSProperties}>
      <div className="pg-wrap">
        <p className="pg-footer-signoff">
          <span className="sc-mono">CH 27 ·</span> End of transmission
        </p>
        <Wordmark monument />
        <TestCard label="SEE YOU 23.07.27" />
        <div className="pg-footer-grid">
          <nav aria-label="Channels, again">
            <ul className="pg-footer-nav">
              {CHANNELS.map((c) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} onClick={() => focusHeading(c.id)}>
                    <span className="pg-nav-ch">{c.ch}</span> {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="pg-footer-notice">
            <p>{NOTICE}</p>
            <p>Not affiliated with any game, studio or publisher.</p>
            <MotionSwitch />
          </div>
        </div>
      </div>
    </footer>
  )
}
