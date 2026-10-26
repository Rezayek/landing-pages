/**
 * Two logins, one kitty (UX.md, after the week): the same money as Ada sees it and as Ivy sees it, side by side on a
 * split ground. The two cards fan in as the section scrolls in (CSS scroll-driven, MOTION.md "Two logins fan in");
 * reduced motion or no support: they rest at their angles. Display only: the controls live in the story.
 */
import type { JSX } from 'react'
import { AllowanceCard, Amount, Avatar, StatusTag, personById } from '@/system/ui'
import { BALANCE_PENCE, IVY_ALLOWANCE } from '../data'

export function TwoLogins(): JSX.Element {
  const ada = personById('ada')
  const ivy = personById('ivy')
  return (
    <section id="two-logins" className="fl-two" data-moment="two-logins" aria-labelledby="two-title">
      <div className="fl-two__head">
        <h2 id="two-title" className="fl-h2">
          Two logins, one kitty
        </h2>
        <p className="fl-body">Parents see the whole household. Kids see their own money, in shorter words, and ask when they need more.</p>
      </div>
      <div className="fl-two__pair">
        <figure className="fl-two__side fl-two__side--parent">
          <figcaption className="fl-two__who">
            <Avatar person={ada} size={32} decorative /> What Ada sees
          </figcaption>
          <div className="k-card fl-two__card">
            <p className="k-muted fl-two__label">In the kitty</p>
            <Amount pence={BALANCE_PENCE} size="xl" />
            <ul className="fl-two__list">
              <li>
                Ivy asked for £5.00 <StatusTag tone="info">Waiting</StatusTag>
              </li>
              <li>
                Groceries <StatusTag tone="negative">£12.40 over</StatusTag>
              </li>
              <li>
                Theo’s pocket money <StatusTag tone="positive">Paid Friday</StatusTag>
              </li>
            </ul>
          </div>
        </figure>
        <figure className="fl-two__side fl-two__side--kid">
          <figcaption className="fl-two__who">
            <Avatar person={ivy} size={32} decorative /> What Ivy sees
          </figcaption>
          {/* A picture of Ivy's screen: its button is shown, not usable here (the live request is in the story) */}
          <div className="fl-two__card fl-two__card--kid" inert>
            <AllowanceCard kid={ivy} amount={IVY_ALLOWANCE.amount} rhythm={IVY_ALLOWANCE.rhythm} next={IVY_ALLOWANCE.next} spent={IVY_ALLOWANCE.spent} saved={IVY_ALLOWANCE.saved} kidView />
          </div>
        </figure>
      </div>
      <p className="fl-sample">Sample household</p>
    </section>
  )
}
