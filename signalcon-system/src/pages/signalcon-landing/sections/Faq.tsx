/**
 * S7 FAQ (CH06, Q7): the nine questions that stop a purchase, then the end CTA. A night band.
 * Native details/summary through the system Accordion (works without JavaScript). Copy: UX.md §S7, data.ts FAQ.
 */
import type { CSSProperties, JSX } from 'react'
import { Accordion, ButtonLink, SectionHeader } from '@/system/ui'
import { FAQ } from '../data'
import './venue-faq.css'

export function Faq({ ctaHref }: { ctaHref: string }): JSX.Element {
  return (
    <section
      className="pg-section"
      id="faq-sec"
      data-wipe=""
      style={{ '--wipe-color': 'var(--paper-50)' } as CSSProperties}
      aria-labelledby="faq"
    >
      <div className="pg-wrap">
        <div className="vf-faq">
          <div className="vf-faq-head">
            <SectionHeader id="faq" channel="CH06" title="Before you" outlined="buy" />
          </div>
          <div className="vf-faq-body">
            <Accordion items={FAQ.map((f) => ({ q: f.q, a: <p>{f.a}</p> }))} />
            <div className="vf-cta">
              <p className="vf-cta-ready">Ready?</p>
              <ButtonLink variant="primary" size="lg" href={ctaHref}>
                Pick your pass · from €39
              </ButtonLink>
              <p className="vf-cta-note">1-day, 3-day or VIP. Prices include tax.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Faq
