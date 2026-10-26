/**
 * S5 Your card number never reaches us (UX.md §S5, Q7): a calm chapter after the loud dispense. Three checks run down a
 * vertical cable (the borrowed Grid Line detail). Each check's index lights, and the cable segment beside it fills, as
 * it crosses the middle of the viewport (MOTION.md "S5 the three checks"; scrubbed with useScroll). Reduced motion: all
 * lit. No other motion here.
 */
import { useRef, useSyncExternalStore, type JSX } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { prefersReducedMotion, subscribeReducedMotion } from '@/system/motion'
import './closing.css'

/** The first two are specs of how it would work (assumed); the label above the list says so once. */
const CHECKS: readonly string[] = [
  'Card fields come from the payment processor. The number goes straight to them, encrypted.',
  "Your bank confirms it's you with 3-D Secure, in your banking app or by text.",
  'One charge per order. The Pay button locks on the first press, and a repeated payment is refused.',
]

function Check({ index, text, last, reduce }: { index: number; text: string; last: boolean; reduce: boolean }): JSX.Element {
  const ref = useRef<HTMLLIElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'start 0.45'] })
  const lit = useTransform(scrollYProgress, [0, 1], [0, 1])
  // the checks run in this order (a real <ol>), so they keep their number, without a decorative zero
  const num = String(index + 1)
  return (
    <li ref={ref} className="vl-check">
      <span className="vl-check__rail" aria-hidden="true">
        <span className="vl-check__index">
          {num}
          <motion.span className="vl-check__lit" style={{ opacity: reduce ? 1 : lit }}>
            {num}
          </motion.span>
        </span>
        {last ? null : (
          <span className="vl-check__track">
            <motion.span className="vl-check__fill" style={{ scaleY: reduce ? 1 : lit }} />
          </span>
        )}
      </span>
      <p className="vl-check__text">{text}</p>
    </li>
  )
}

export function Payment(): JSX.Element {
  const reduce = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true)
  return (
    <section id="payment" data-chapter="payment" aria-labelledby="payment-title" className="vl-chapter vl-payment">
      <div className="vl-wrap">
        <div className="vl-panel vl-payment__panel">
          <div className="vl-payment__head">
            <h2 id="payment-title" tabIndex={-1} className="vl-h2">
              Your card number never reaches us
            </h2>
            <p className="vl-sub">Card details go to the payment processor, not to VOLTCART. Three checks run before a key is issued.</p>
          </div>
          <div className="vl-payment__checks">
            <ol className="vl-checks" role="list" aria-label="The three checks">
              {CHECKS.map((text, i) => (
                <Check key={text} index={i} text={text} last={i === CHECKS.length - 1} reduce={reduce} />
              ))}
            </ol>
            <p className="vl-payment__note">This is how payment would work in this design study.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
