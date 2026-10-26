/**
 * S6 Questions before you pay (UX.md §S6, Q8; A22): five questions in the system Accordion. Calm by design: no entrance
 * motion; the Accordion handles the disclosure.
 */
import type { JSX } from 'react'
import { Accordion } from '@/system/components'
import './closing.css'

const FAQ: readonly { q: string; a: string }[] = [
  {
    q: 'Will the key work in my region?',
    a: "Each key says where it activates: Works in Europe, North America only, or Works everywhere. Pick your region above the deals and keys that won't activate are hidden.",
  },
  {
    q: "What if the code doesn't work?",
    a: 'Report it from the order page within 30 days. If the code is bad, we send a new key or refund you in full.',
  },
  {
    q: "What's the catch with cheaper battle passes?",
    a: 'The code is for one platform and one account region, and it has to be redeemed before the season ends. The date is on every pass. The premium tiers it opens are listed on the card.',
  },
  {
    q: 'Can I get my money back?',
    a: "Yes, until you show the code: a full refund within 3 days. Once the code is shown, the order can't be refunded, unless the code doesn't work.",
  },
  {
    q: 'Do I need an account?',
    a: 'Not to browse or fill your cart. You sign in at checkout so your keys stay in your library.',
  },
]

export function Questions(): JSX.Element {
  return (
    <section id="questions" data-chapter="questions" aria-labelledby="questions-title" className="vl-chapter vl-questions">
      <div className="vl-wrap">
        <div className="vl-panel vl-questions__panel">
          <h2 id="questions-title" tabIndex={-1} className="vl-h2">
            Questions before you pay
          </h2>
          <div className="vl-questions__list">
            {FAQ.map((item) => (
              <Accordion key={item.q} title={item.q}>
                <p className="vl-questions__answer">{item.a}</p>
              </Accordion>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
