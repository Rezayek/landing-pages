/**
 * S3 Battle passes on sale this week (UX.md §S3, MOTION.md "S3 billboard" and "S3 TierTrack").
 * Four pass cards on a billboard that tilts up from the street as it scrolls in (motion/react useScroll, scrubbed;
 * flat under reduced motion and on phones). Each card is a Kiosk-shaped surface (the system's `vc-kiosk` classes, so
 * it looks like the deals above) built here because a pass lists several platforms and the Kiosk takes one. The tier
 * strip is a compact TierTrack: the system Charge, 20 blocks of 5 tiers, lit left to right when it comes into view.
 * Add to cart is the system ActionButton; the cart is the page's cartStore.
 */
import { useId, useRef, useState, useSyncExternalStore, type JSX } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ActionButton } from '@/system/feedback'
import { CheckIcon, GlobeIcon, KeyIcon } from '@/system/feedback/icons'
import { Button, Charge, DiscountTag, PlatformTag, type Platform } from '@/system/components'
import { preset } from '@/system/motion'
import { PASSES, REGION_LINE, money, percentOff, type Pass } from '../data'
import { cartStore, simulated, useCart } from '../state'
import './passes.css'

/** Pass platform names as data.ts writes them, to the system's platform codes. */
const PLATFORM_CODE: Record<string, Platform> = { PC: 'PC', PlayStation: 'PS5', Xbox: 'XBOX', Switch: 'SWITCH' }

/** One block of the tier strip is this many tiers: 20 blocks cover tiers 1-100. */
const TIERS_PER_BLOCK = 5
const BLOCKS = 100 / TIERS_PER_BLOCK

/** No tilt on phones or any touch screen: the board stays flat, so its buttons keep their 44 px targets. */
const PHONE = '(max-width: 47.99rem), (pointer: coarse)'
const subscribePhone = (fn: () => void): (() => void) => {
  const mq = window.matchMedia(PHONE)
  mq.addEventListener('change', fn)
  return () => mq.removeEventListener('change', fn)
}
const isPhone = (): boolean => window.matchMedia(PHONE).matches

/** The billboard: tilts from rotateX(18deg), scale .92 to flat while the board scrolls from the bottom edge to the middle. */
function Billboard({ children }: { children: React.ReactNode }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const phone = useSyncExternalStore(subscribePhone, isPhone, () => false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.55'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], [phone ? 8 : 18, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1])
  return (
    <div ref={ref} className="vp-board">
      <motion.div className="vp-board__tilt" style={reduce || phone ? undefined : { rotateX, scale }}>
        {children}
      </motion.div>
    </div>
  )
}

/** Which premium tiers the code opens at once. The rest are earned, and the strip says so in words. */
function PassTiers({ pass }: { pass: Pass }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const lit = Math.floor(pass.tiersAtOnce / TIERS_PER_BLOCK)
  const top = pass.rewards[100]
  return (
    <div ref={ref} className="vp-tiers">
      <p className="vp-tiers__title">Opens premium tiers 1–100</p>
      <Charge segments={BLOCKS} on={seen || reduce ? lit : 0} />
      <p className="vp-tiers__scale" aria-hidden="true">
        <span>1</span>
        <span>{top ? `100 · ${top}` : '100'}</span>
      </p>
      <p className="vp-tiers__note">
        {pass.tiersAtOnce
          ? `Tiers 1–${pass.tiersAtOnce} come at once; ${pass.tiersAtOnce + 1}–100 you earn by playing.`
          : 'Every tier, 1–100, is earned by playing.'}
      </p>
    </div>
  )
}

function PassCard({ pass }: { pass: Pass }): JSX.Element {
  const titleId = useId()
  const reduce = useReducedMotion()
  const { items } = useCart()
  const inCart = items.includes(pass.id)
  const [holding, setHolding] = useState(false)
  const [coverState, setCoverState] = useState<'loading' | 'ok' | 'failed'>('loading')
  const name = `${pass.game} ${pass.season}`
  const off = percentOff(pass.price, pass.list)
  const showInCart = inCart && !holding
  const platforms = pass.platforms.split(', ').map((p) => ({ label: p, code: PLATFORM_CODE[p] }))

  return (
    <article className="vc-kiosk vc-cut vc-cut--card vp-pass" data-size="regular" data-in-cart={inCart || undefined} aria-labelledby={titleId}>
      <p className="vc-kiosk__meta">
        <span className="vc-kiosk__meta-data">Sale ends {pass.saleEnds}</span>
      </p>
      <div className="vc-kiosk__cover" data-state={coverState}>
        <img
          src={pass.art}
          alt=""
          loading="lazy"
          decoding="async"
          width={960}
          height={640}
          onLoad={() => setCoverState('ok')}
          onError={() => setCoverState('failed')}
        />
        <span className="vc-kiosk__plate" aria-hidden="true">
          {name}
        </span>
      </div>
      <div className="vc-kiosk__body">
        <h3 id={titleId} className="vc-kiosk__title">
          {pass.game}
        </h3>
        <p className="vp-pass__season">
          {pass.season} <span aria-hidden="true">·</span> {pass.edition}
        </p>
        <p className="vc-kiosk__tags">
          <span className="vc-sr">Platforms: </span>
          {platforms.map((p) => (p.code ? <PlatformTag key={p.label} platform={p.code} /> : <span key={p.label}>{p.label}</span>))}
          <span className="vc-kiosk__region">
            <span className="vc-icon" aria-hidden="true">
              <GlobeIcon />
            </span>
            {REGION_LINE[pass.region]}
          </span>
        </p>
        <p className="vc-kiosk__price">
          <span className="vc-kiosk__now">
            <span className="vc-sr">Now </span>
            {money(pass.price)}
          </span>
          <s className="vc-kiosk__list">
            <span className="vc-sr">List price </span>
            {money(pass.list)}
          </s>
          <DiscountTag percent={off} />
        </p>
        <p className="vc-kiosk__save">You save {money(pass.list - pass.price)}</p>
        <p className="vp-pass__ends">
          <span className="vp-pass__ends-label">Redeem before</span> Season ends {pass.seasonEnds}
        </p>
        <PassTiers pass={pass} />
        <div className="vc-kiosk__action">
          {showInCart ? (
            <div className="vc-kiosk__incart">
              <span className="vc-kiosk__incart-label">
                <span className="vc-icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                In cart
              </span>
              <Button variant="secondary" onClick={() => cartStore.remove(pass.id, name)} aria-label={`Remove ${name} from your cart`}>
                Remove
              </Button>
            </div>
          ) : (
            <ActionButton
              variant="primary"
              onAction={(signal) => simulated(true, signal)}
              pendingLabel="Adding…"
              successLabel="Added"
              successMessage={false}
              errorMessage={() => "We couldn't add it. Your cart didn't change. Try again."}
              onSuccess={() => {
                setHolding(true)
                cartStore.add(pass.id, name)
              }}
              onDone={() => setHolding(false)}
              aria-label={`Add pass to cart: ${name}, ${money(pass.price)}`}
            >
              Add pass to cart
            </ActionButton>
          )}
          <span className="vc-kiosk__slot" aria-hidden="true">
            {inCart ? (
              <motion.span className="vc-kiosk__keytab" {...(reduce ? {} : preset.dispense)} key="tab">
                <span className="vc-icon">
                  <KeyIcon />
                </span>
                SEASON CODE
              </motion.span>
            ) : null}
          </span>
        </div>
      </div>
    </article>
  )
}

export function Passes(): JSX.Element {
  return (
    <section id="passes" data-chapter="passes" aria-labelledby="passes-title" className="vl-chapter vp-passes">
      <div className="vl-wrap">
        <header className="vl-panel vp-passes__head">
          <h2 id="passes-title" tabIndex={-1} className="vl-h2">
            Battle passes on sale this week
          </h2>
          <p className="vl-sub">
            Premium tracks for four seasons, sold as codes. The catch is on each card: the code redeems on one platform, in one region, before the season ends.
          </p>
        </header>
        <Billboard>
          <ul className="vp-passes__grid">
            {PASSES.map((pass) => (
              <li key={pass.id}>
                <PassCard pass={pass} />
              </li>
            ))}
          </ul>
        </Billboard>
      </div>
    </section>
  )
}
