/**
 * S1 (UX.md §S1; MOTION.md hero rows): the headline and Kiosk 01 over the live street. The headline and the kiosk are
 * in the first render and never wait for motion. Kiosk 01 powers on (its edge traces once, a scan passes its cover),
 * its Add to cart strikes the system lightning and drops a key tab, and the street's cable carries the charge to it.
 */
import { useEffect, useState, type JSX } from 'react'
import { Button, Kiosk } from '@/system/components'
import { LEAD, MAX_OFF, PLATFORM_NAME, REGION_LINE } from '../data'
import { cartStore, sceneBus, simulated, useCart } from '../state'
import { goTo } from './Header'

export function Hero(): JSX.Element {
  const { items } = useCart()
  const inCart = items.includes(LEAD.id)
  const [phase, setPhase] = useState<'idle' | 'adding'>('idle')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 40) setScrolled(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const caption = inCart
    ? 'In your cart. Your code shows about 1 min after you pay.'
    : phase === 'adding'
      ? 'Adding to your cart…'
      : `${PLATFORM_NAME[LEAD.platform]} key, code in about 1 min after you pay.`

  return (
    <section id="top" data-chapter="hero" aria-labelledby="hero-title" className="vl-hero">
      <div className="vl-wrap vl-hero__grid">
        <h1 id="hero-title" className="vl-hero__h1" tabIndex={-1}>
          Game keys up to {MAX_OFF}% off
        </h1>
        <div className="vl-hero__rest">
          <p className="vl-hero__sub">Keys and battle passes for PC, PlayStation, Xbox and Switch. Pay, and the code shows on screen in about 1 min.</p>
          <div className="vl-hero__actions">
            <Button variant="secondary" size="large" onClick={(e) => goTo('deals', e)}>
              Browse all 8 deals
            </Button>
            <a
              className="vl-hero__link"
              href="#deals"
              onClick={(e) => {
                e.preventDefault()
                goTo('deals')
                // The region picker answers this question: focus it once the scroll has started.
                window.setTimeout(() => document.querySelector<HTMLElement>('[data-region-picker] [role=combobox]')?.focus({ preventScroll: true }), 60)
              }}
            >
              Will my key work in my region?
            </a>
          </div>
          <p className="vl-hero__note">Sample prices. VOLTCART is a design study: nothing here can be bought.</p>
          <p className="vl-prompt" data-gone={scrolled || undefined} aria-hidden="true">
            <span className="vl-prompt__arrow">↓</span> Scroll for today's deals
          </p>
        </div>
        <div className="vl-hero__kiosk" data-moment="kiosk-power-on">
          <Kiosk
            number={1}
            size="lead"
            headingLevel={2}
            priority
            title={LEAD.title}
            platform={LEAD.platform}
            regionLine={REGION_LINE[LEAD.region]}
            price={LEAD.price}
            list={LEAD.list}
            meta={LEAD.meta}
            cover={LEAD.cover}
            inCart={inCart}
            keyHint="NDX4K-•••••"
            onIntent={() => sceneBus.emit({ type: 'pulse', kiosk: 1 })}
            onAdd={async (signal) => {
              setPhase('adding')
              try {
                return await simulated(true, signal)
              } finally {
                setPhase('idle')
              }
            }}
            onAdded={() => {
              cartStore.add(LEAD.id, LEAD.title)
              sceneBus.emit({ type: 'pulse', kiosk: 1 })
            }}
            onRemove={() => cartStore.remove(LEAD.id, LEAD.title)}
            caption={caption}
            note="Design study: nothing is charged."
          />
          <svg className="vl-trace" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0 H95 L100 4 V100 H5 L0 96 Z" pathLength={1} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
    </section>
  )
}
