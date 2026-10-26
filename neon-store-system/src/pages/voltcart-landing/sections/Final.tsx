/**
 * S7 Get your first key (UX.md §S7, Q9; A5, A6, A19): the street's end. The H2's words assemble as it scrolls in
 * (MOTION.md "S7 street's end"; scrubbed, legible at every position; reduced motion: static), then the lead deal as a
 * mini Kiosk with the primary action, and the secondary link back to the deals.
 */
import { Fragment, useRef, useSyncExternalStore, type JSX, type MouseEvent } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Kiosk, TextLink } from '@/system/components'
import { prefersReducedMotion, subscribeReducedMotion } from '@/system/motion'
import { DEALS, LEAD, PLATFORM_NAME, REGION_LINE, money } from '../data'
import { cartStore, sceneBus, simulated, useCart } from '../state'
import './closing.css'

const WORDS = ['Get', 'your', 'first', 'key'] as const

/** One word: it starts `from` travel steps away from its place (the travel token, so 0 under reduced motion) and settles. */
function Word({ word, from, progress, reduce }: { word: string; from: number; progress: MotionValue<number>; reduce: boolean }): JSX.Element {
  const steps = useTransform(progress, [0, 1], [from, 0])
  const transform = useMotionTemplate`translateX(calc(var(--travel-lg) * ${steps}))`
  return (
    <motion.span className="vl-word" style={reduce ? undefined : { transform }}>
      {word}
    </motion.span>
  )
}

/** Browse all deals: scroll to S2 and give its heading focus (UX.md A19). */
function browseDeals(event: MouseEvent<HTMLAnchorElement>): void {
  const target = document.getElementById('deals')
  if (!target) return
  event.preventDefault()
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  document.getElementById('deals-title')?.focus({ preventScroll: true })
}

export function Final(): JSX.Element {
  const reduce = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true)
  const cart = useCart()
  const heading = useRef<HTMLHeadingElement>(null)
  const { scrollYProgress } = useScroll({ target: heading, offset: ['start 0.95', 'start 0.55'] })
  const mid = (WORDS.length - 1) / 2

  return (
    <section id="final" data-chapter="final" aria-labelledby="final-title" className="vl-chapter vl-final">
      <div className="vl-wrap">
        <div className="vl-panel vl-final__panel">
          <h2 ref={heading} id="final-title" tabIndex={-1} className="vl-h2">
            {WORDS.map((word, i) => (
              <Fragment key={word}>
                {i > 0 ? ' ' : null}
                <Word word={word} from={i - mid} progress={scrollYProgress} reduce={reduce} />
              </Fragment>
            ))}
          </h2>
          <p className="vl-sub">
            {LEAD.title} for {PLATFORM_NAME[LEAD.platform]}: {money(LEAD.price)}, the lowest in 90 days. {REGION_LINE[LEAD.region]}, code in about 1 min.
          </p>
          <div className="vl-final__kiosk">
            <Kiosk
              size="mini"
              number={1}
              title={LEAD.title}
              platform={LEAD.platform}
              regionLine={REGION_LINE[LEAD.region]}
              price={LEAD.price}
              list={LEAD.list}
              meta={LEAD.meta}
              cover={LEAD.cover}
              inCart={cart.items.includes(LEAD.id)}
              onAdd={(signal) => simulated(true, signal)}
              onAdded={() => {
                cartStore.add(LEAD.id, LEAD.title)
                sceneBus.emit({ type: 'pulse', kiosk: 1 })
              }}
              onRemove={() => cartStore.remove(LEAD.id, LEAD.title)}
              note="Design study: nothing is charged."
            />
          </div>
          <p className="vl-final__more">
            <TextLink href="#deals" variant="standalone" onClick={browseDeals}>
              Browse all {DEALS.length} deals
            </TextLink>
          </p>
        </div>
      </div>
    </section>
  )
}
