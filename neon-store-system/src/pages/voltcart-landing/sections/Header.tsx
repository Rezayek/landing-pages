/**
 * Header (UX.md §Header; A16, A17, A18, A19, A21): logo, plain-word navigation, Pause motion, the cart (outlined,
 * secondary) and, under 64rem, a Menu sheet. In-page links move focus to the section's heading.
 */
import { useEffect, useId, useRef, useState, type JSX, type MouseEvent } from 'react'
import { Button, Logo, MotionPauseButton } from '@/system/components'
import { CartIcon, CloseIcon, MenuIcon } from '@/system/feedback/icons'
import { EmptyState } from '@/system/feedback'
import { prefersReducedMotion } from '@/system/motion'
import { DEALS, PASSES, PLATFORM_NAME, money } from '../data'
import { cartStore, useCart } from '../state'

export const NAV = [
  { id: 'deals', label: 'Deals' },
  { id: 'passes', label: 'Battle passes' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
  { id: 'questions', label: 'Questions' },
] as const

/** Scroll to a section and give its heading focus (UX.md A19). */
export function goTo(id: string, event?: MouseEvent, then?: () => void): void {
  const target = document.getElementById(id)
  if (!target) return
  event?.preventDefault()
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  const heading = document.getElementById(`${id}-title`) ?? target
  heading.focus({ preventScroll: true })
  history.replaceState(null, '', `#${id}`)
  then?.()
}

interface Line {
  id: string
  title: string
  meta: string
  price: number
  list: number
  cover: string
}

function lineFor(id: string): Line | null {
  const d = DEALS.find((x) => x.id === id)
  if (d) return { id, title: d.title, meta: `${PLATFORM_NAME[d.platform]} key`, price: d.price, list: d.list, cover: d.cover }
  const p = PASSES.find((x) => x.id === id)
  if (p) return { id, title: `${p.game} ${p.season}`, meta: `${p.edition} season code`, price: p.price, list: p.list, cover: p.art }
  return null
}

function CartPanel({ id, onClose, onLeave }: { id: string; onClose: () => void; onLeave: () => void }): JSX.Element {
  const { items, removed } = useCart()
  const title = useRef<HTMLHeadingElement>(null)
  const lines = items.map(lineFor).filter((l): l is Line => !!l)
  const gone = removed.map(lineFor).filter((l): l is Line => !!l).slice(0, 1)
  const subtotal = lines.reduce((s, l) => s + l.price, 0)
  const save = lines.reduce((s, l) => s + (l.list - l.price), 0)
  useEffect(() => title.current?.focus(), [])
  return (
    <div id={id} role="dialog" aria-labelledby={`${id}-t`} className="vl-cartpanel vc-cut">
      <div className="vc-row" style={{ justifyContent: 'space-between' }}>
        <h2 id={`${id}-t`} ref={title} tabIndex={-1} className="vl-cartpanel__title">
          Your cart
        </h2>
        <Button variant="quiet" iconOnly label="Close cart" icon={<CloseIcon />} onClick={onClose} />
      </div>
      {lines.length ? (
        <>
          <ul className="vl-cartpanel__lines">
            {lines.map((l) => (
              <li key={l.id} className="vl-cartline">
                <img src={l.cover} alt="" width={960} height={640} loading="lazy" />
                <span>
                  <span className="vl-cartline__name">{l.title}</span>
                  <br />
                  <span className="vl-cartline__meta">
                    {l.meta} · {money(l.price)}
                  </span>
                </span>
                <Button variant="secondary" onClick={() => cartStore.remove(l.id, l.title)} aria-label={`Remove ${l.title} from your cart`}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <dl className="vl-cartpanel__sum">
            <dt>Subtotal</dt>
            <dd>{money(subtotal)}</dd>
            <dt className="vl-cartpanel__save">You save</dt>
            <dd className="vl-cartpanel__save">{money(save)}</dd>
          </dl>
          <Button variant="primary" disabledReason="Design study: checkout isn't connected. Nothing is charged.">
            Check out
          </Button>
        </>
      ) : (
        <EmptyState
          kind="first-use"
          headingLevel={3}
          title="Your cart is empty"
          action={
            <Button variant="secondary" onClick={(e) => goTo('deals', e, onLeave)}>
              Browse deals
            </Button>
          }
        >
          Keys you add stay here on this device.
        </EmptyState>
      )}
      {gone.map((l) => (
        <p key={l.id} className="vl-removed">
          <span>Removed {l.title} from your cart</span>
          <Button variant="secondary" onClick={() => cartStore.undo(l.id, l.title)}>
            Undo
          </Button>
        </p>
      ))}
    </div>
  )
}

export function Header(): JSX.Element {
  const { items } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const cartId = useId()
  const menuId = useId()
  const cartButton = useRef<HTMLButtonElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const anchor = useRef<HTMLDivElement>(null)

  const closeCart = (refocus = true) => {
    setCartOpen(false)
    if (refocus) cartButton.current?.focus()
  }
  const closeMenu = (refocus = true) => {
    setMenuOpen(false)
    if (refocus) menuButton.current?.focus()
  }

  useEffect(() => {
    if (!cartOpen && !menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (cartOpen) closeCart()
      if (menuOpen) closeMenu()
    }
    const onDown = (e: PointerEvent) => {
      if (cartOpen && !anchor.current?.contains(e.target as Node)) closeCart(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [cartOpen, menuOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header className="vl-header">
      <div className="vl-wrap vl-header__bar">
        <Logo href="#top" />
        <nav className="vl-header__nav" aria-label="Sections">
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={(e) => goTo(n.id, e)}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="vl-header__end">
          <MotionPauseButton />
          <div className="vl-cart-anchor" ref={anchor}>
            <button
              ref={cartButton}
              type="button"
              className="vc-btn vc-cut"
              data-variant="secondary"
              aria-label={`Cart, ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
              aria-expanded={cartOpen}
              aria-controls={cartOpen ? cartId : undefined}
              onClick={() => (cartOpen ? closeCart() : setCartOpen(true))}
            >
              <span className="vc-icon" aria-hidden="true">
                <CartIcon />
              </span>
              <span className="vl-cart-label">
                <span className="vl-hide-narrow">Cart </span>({items.length})
              </span>
            </button>
            {cartOpen ? <CartPanel id={cartId} onClose={() => closeCart()} onLeave={() => closeCart(false)} /> : null}
          </div>
          <button
            ref={menuButton}
            type="button"
            className="vc-btn vc-cut vl-header__menu"
            data-variant="quiet"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
          >
            <span className="vc-icon" aria-hidden="true">
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </span>
            <span className="vl-hide-narrow">Menu</span>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav id={menuId} className="vl-sheet" aria-label="Sections">
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a href={`#${n.id}`} ref={(el) => (i === 0 ? el?.focus() : undefined)} onClick={(e) => goTo(n.id, e, () => closeMenu(false))}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <MotionPauseButton />
        </nav>
      ) : null}
    </header>
  )
}
