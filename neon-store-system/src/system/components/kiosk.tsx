/**
 * Kiosk: a deal as a lit street kiosk (COMPONENTS.md "Kiosk deal surface", added for voltcart-landing, 0.6.0).
 * A GameCard variant for marketing pages: one line of real data ("Lowest in 90 days"), the saving in money, the region line, and an in-place cart state: Add to cart → Added → In cart
 * with Remove, while a key tab drops out of the kiosk's slot (`preset.dispense`).
 *
 * States: idle · hover/focus (edge to --focus) · adding (ActionButton pending, lightning) ·
 * added (success, 1.5 s) · in cart (secondary "In cart" status + Remove, key tab shown) · add failed (ActionButton
 * error + inline line, cart unchanged) · cover loading / failed (the plate) · reduced motion (no drop, no trace).
 */
import { useId, useState, type JSX, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ActionButton } from '../feedback'
import { CheckIcon, GlobeIcon, KeyIcon } from '../feedback/icons'
import { cx } from '../feedback/internal'
import { preset } from '../motion'
import { Button, DiscountTag, PlatformTag, type Platform } from './primitives'
import './marketing.css'

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export interface KioskProps {
  /** "Kiosk 01". */
  number: number
  title: string
  platform: Platform
  /** "Works in Europe", "North America only", "Works everywhere". */
  regionLine: string
  price: number
  list: number
  /** One line of real data. */
  meta: string
  cover: string
  /** `lead` is the large deal of the day; `regular` sits in the grid; `mini` is a one-line reminder (final CTA). */
  size?: 'lead' | 'regular' | 'mini'
  headingLevel?: 2 | 3
  inCart: boolean
  /** The work: add to the cart. Reject to show the failure. */
  onAdd: (signal: AbortSignal) => Promise<unknown>
  /** Called once the add has succeeded, to put the item in the cart (and tell the scene). */
  onAdded: () => void
  onRemove: () => void
  /** A live caption under the action (reserved one line). */
  caption?: ReactNode
  /** Extra content: a price chart, an alert control. */
  children?: ReactNode
  /** Below the action: "Design study: nothing is charged." */
  note?: ReactNode
  /** Eager-load the cover (first screen). */
  priority?: boolean
  /** Masked key shown on the tab: "NDX4K-•••••". */
  keyHint?: string
  addLabel?: string
  className?: string
  /** Fires when a pointer enters or focus reaches the add button: the page can echo it (a pulse in a scene). */
  onIntent?: () => void
}

export function Kiosk({
  number,
  title,
  platform,
  regionLine,
  price,
  list,
  meta,
  cover,
  size = 'regular',
  headingLevel = 3,
  inCart,
  onAdd,
  onAdded,
  onRemove,
  caption,
  children,
  note,
  priority,
  keyHint,
  addLabel = 'Add to cart',
  className,
  onIntent,
}: KioskProps): JSX.Element {
  const titleId = useId()
  const [holding, setHolding] = useState(false)
  const [coverState, setCoverState] = useState<'loading' | 'ok' | 'failed'>('loading')
  const reduce = useReducedMotion()
  const H = headingLevel === 2 ? 'h2' : 'h3'
  const off = Math.round((1 - price / list) * 100)
  const save = list - price
  const showInCart = inCart && !holding

  return (
    <article className={cx('vc-kiosk vc-cut vc-cut--card', className)} data-size={size} data-kiosk={number} data-in-cart={inCart || undefined} aria-labelledby={titleId}>
      <p className="vc-kiosk__meta">{meta}</p>
      {size === 'mini' ? null : (
        <div className="vc-kiosk__cover" data-state={coverState}>
          <img
            src={cover}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            width={960}
            height={640}
            onLoad={() => setCoverState('ok')}
            onError={() => setCoverState('failed')}
          />
          <span className="vc-kiosk__plate" aria-hidden="true">
            {title}
          </span>
        </div>
      )}
      <div className="vc-kiosk__body">
        <H id={titleId} className="vc-kiosk__title">
          {title}
        </H>
        <p className="vc-kiosk__tags">
          <PlatformTag platform={platform} />
          <span className="vc-kiosk__region">
            <span className="vc-icon" aria-hidden="true">
              <GlobeIcon />
            </span>
            {regionLine}
          </span>
        </p>
        <p className="vc-kiosk__price">
          <span className="vc-kiosk__now">
            <span className="vc-sr">Now </span>
            {money(price)}
          </span>
          <s className="vc-kiosk__list">
            <span className="vc-sr">List price </span>
            {money(list)}
          </s>
          <DiscountTag percent={off} />
        </p>
        <p className="vc-kiosk__save">You save {money(save)}</p>
        {children}
        <div className="vc-kiosk__action" onPointerEnter={onIntent} onFocusCapture={onIntent}>
          {showInCart ? (
            <div className="vc-kiosk__incart">
              <span className="vc-kiosk__incart-label">
                <span className="vc-icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                In cart
              </span>
              <Button variant="secondary" onClick={onRemove} aria-label={`Remove ${title} from your cart`}>
                Remove
              </Button>
            </div>
          ) : (
            <ActionButton
              variant="primary"
              onAction={onAdd}
              pendingLabel="Adding…"
              successLabel="Added"
              successMessage={false}
              errorMessage={() => "We couldn't add it. Your cart didn't change. Try again."}
              onSuccess={() => {
                setHolding(true)
                onAdded()
              }}
              onDone={() => setHolding(false)}
              aria-label={`${addLabel}: ${title}, ${money(price)}`}
            >
              {addLabel}
            </ActionButton>
          )}
          <span className="vc-kiosk__slot" aria-hidden="true">
            {inCart ? (
              <motion.span className="vc-kiosk__keytab" {...(reduce ? {} : preset.dispense)} key="tab">
                <span className="vc-icon">
                  <KeyIcon />
                </span>
                {keyHint ?? `${platform} key`}
              </motion.span>
            ) : null}
          </span>
        </div>
        {caption !== undefined ? (
          <p className="vc-kiosk__caption" aria-hidden="true">
            {caption}
          </p>
        ) : null}
        {note ? <p className="vc-kiosk__note">{note}</p> : null}
      </div>
    </article>
  )
}
