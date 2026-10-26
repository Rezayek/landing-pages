/**
 * The store's own components (COMPONENTS.md, Specs — data display): game card, price readout, readout tile, table,
 * summary list, cart line, tier cards and track, the code receipt (the signature), the chart set with its legend,
 * avatar. All sample data is invented (VOLTCART is a design study).
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type JSX, type ReactNode } from 'react'
import { InlineMessage, Skeleton, Spinner } from '../feedback'
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, WarningIcon } from '../feedback/icons'
import { prefersReducedMotion } from '../motion'
import { Button, CopyButton, DiscountTag, LogoMark, PlatformTag, RegionTag, StatusTag, Wordmark, WishlistToggle, type Platform, type StatusTone } from './primitives'
import { QuantityStepper } from './forms'
import { Accordion } from './navigation'
import './vc.css'

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

/* Sample data ----------------------------------------------------------------------------------------------------- */
export interface Game {
  id: string
  title: string
  platform: Platform
  region: string
  price: number
  list: number
  lowest90?: boolean
  art: 'a' | 'b' | 'c'
  regionOk?: boolean
  soldOut?: boolean
  dropped?: boolean
  /** A public sample photo (Unsplash licence, served by picsum.photos); never a real game's art. */
  cover?: string
}

/** Fixed seeds, so every capture shows the same photo. A broken URL shows the failed state. */
const photo = (seed: string) => `https://picsum.photos/seed/${seed}/600/800`

export const GAMES: readonly Game[] = [
  { id: 'neon-drift', title: 'Neon Drift', platform: 'PC', region: 'EU', price: 23.99, list: 59.99, lowest90: true, art: 'a', regionOk: true, cover: photo('voltcart-neon-drift') },
  { id: 'gridrunner', title: 'Gridrunner Season 4: Premium+', platform: 'PS5', region: 'Global', price: 14.99, list: 24.99, art: 'b', regionOk: true, cover: photo('voltcart-gridrunner') },
  { id: 'chrome-saints', title: 'Chrome Saints', platform: 'XBOX', region: 'US', price: 32.49, list: 69.99, art: 'c', regionOk: false, cover: photo('voltcart-chrome-saints') },
  { id: 'hexfall', title: 'Hexfall: The Long Night of the Seventeen Signal Towers', platform: 'SWITCH', region: 'EU', price: 19.99, list: 19.99, art: 'a', regionOk: true, soldOut: true },
  { id: 'static-bloom', title: 'Static Bloom', platform: 'PC', region: 'Global', price: 8.49, list: 29.99, art: 'b', regionOk: true, dropped: true, cover: 'https://picsum.photos/id/this-photo-does-not-exist/600/800' },
]

const pct = (g: Game) => Math.round((1 - g.price / g.list) * 100)

/* Cover: a public sample photo when there is one, over the neutral plate that stands in while it loads, when it
   fails and when a game has none. Same box in every state (3:4), so nothing moves. Decorative: the title is beside it. */
export function CoverArt({ game, small }: { game: Game; small?: boolean }): JSX.Element {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>(game.cover ? 'loading' : 'failed')
  return (
    <div className="vc-cover" data-state={game.cover ? state : 'none'}>
      <div className="vc-cover-art" data-art={game.art} aria-hidden="true">
        {small || state === 'loaded' ? null : <span className="vc-cover-art__note">{state === 'loading' ? 'Loading cover…' : 'Sample art'}</span>}
      </div>
      {game.cover && state !== 'failed' ? (
        <img src={game.cover} alt="" width={600} height={800} loading="lazy" decoding="async" onLoad={() => setState('loaded')} onError={() => setState('failed')} />
      ) : null}
    </div>
  )
}

/* Price readout --------------------------------------------------------------------------------------------------- */
export function PriceReadout({ price, list, size = 'compact', lowest, changedFrom, busy, soldOut }: { price: number; list?: number; size?: 'compact' | 'large' | 'line'; lowest?: boolean; changedFrom?: number; busy?: boolean; soldOut?: boolean }): JSX.Element {
  if (soldOut) return <p className="vc-price vc-muted">Not available</p>
  const discount = list && list > price ? Math.round((1 - price / list) * 100) : 0
  return (
    <div className="vc-price" data-size={size} data-busy={busy || undefined} aria-busy={busy || undefined}>
      <span className="vc-price__now">{price === 0 ? 'Free' : money(price)}</span>
      {discount ? (
        <>
          <span className="vc-price__was">
            <span className="vc-sr">was </span>
            {money(list!)}
          </span>
          <DiscountTag percent={discount} />
        </>
      ) : null}
      {size === 'large' && discount ? <p className="vc-price__save">You save {money(list! - price)}</p> : null}
      {size === 'large' && lowest ? <p className="vc-price__low">Lowest in 90 days</p> : null}
      {busy ? (
        <span className="vc-price__busy">
          <Spinner size="sm" /> Updating
        </span>
      ) : null}
      {changedFrom !== undefined ? (
        <p className="vc-price__changed">
          Price changed from {money(changedFrom)} to {money(price)} since you added it.
        </p>
      ) : null}
    </div>
  )
}

/* Game card ------------------------------------------------------------------------------------------------------- */
export function GameCard({ game, variant = 'store', preview, onWish }: { game: Game; variant?: 'store' | 'library' | 'wishlist'; preview?: 'hover' | 'focus'; onWish?: (next: boolean) => Promise<unknown> }): JSX.Element {
  const name = `${game.title}, ${game.platform === 'XBOX' ? 'Xbox' : game.platform === 'SWITCH' ? 'Switch' : game.platform}, ${game.soldOut ? 'sold out' : `${money(game.price)}${game.list > game.price ? `, was ${money(game.list)}, ${pct(game)}% off` : ''}`}${game.regionOk === false ? ", won't activate in Germany" : ''}`
  return (
    <article className="vc-card vc-cut" data-preview={preview}>
      <div className="vc-card__cover">
        <CoverArt game={game} />
      </div>
      {variant !== 'library' ? (
        <span className="vc-card__wish">
          <WishlistToggle game={game.title} saved={variant === 'wishlist'} onSave={onWish ?? (() => Promise.resolve())} />
        </span>
      ) : null}
      <div className="vc-card__body">
        <div className="vc-row">
          <PlatformTag platform={game.platform} />
          {game.region !== 'Global' ? <RegionTag region={game.region} /> : null}
        </div>
        <h3 className="vc-card__title">
          <a className="vc-card__link" href={`#game-${game.id}`} aria-label={name}>
            {game.title}
          </a>
        </h3>
        {variant === 'library' ? (
          <div className="vc-row">
            <StatusTag tone="positive">Delivered</StatusTag>
          </div>
        ) : game.soldOut ? (
          <StatusTag tone="negative">Sold out</StatusTag>
        ) : (
          <PriceReadout price={game.price} list={game.list} />
        )}
        {game.regionOk === false ? (
          <p className="vc-card__note" data-tone="warning">
            <span className="vc-icon" aria-hidden="true">
              <WarningIcon />
            </span>
            Won't activate in Germany
          </p>
        ) : null}
        {game.dropped && variant === 'wishlist' ? (
          <p className="vc-card__note" data-tone="positive">
            <span className="vc-icon" aria-hidden="true">
              <ArrowDownIcon />
            </span>
            Price dropped
          </p>
        ) : null}
      </div>
    </article>
  )
}

export function GameCardSkeleton(): JSX.Element {
  return (
    <div className="vc-card vc-cut" aria-hidden="true">
      <div className="vc-card__cover">
        <Skeleton variant="rect" width="100%" height="100%" />
      </div>
      {/* Shaped like the card body: tag row, title, price readout, so the swap moves nothing. */}
      <div className="vc-card__body">
        <Skeleton width="40%" height="var(--space-5)" />
        <Skeleton variant="heading" />
        <Skeleton width="55%" height="var(--space-6)" />
      </div>
    </div>
  )
}

/* Readout tile (KPI) ---------------------------------------------------------------------------------------------- */
export function ReadoutTiles({ items }: { items: readonly { label: string; value: string; change?: string; good?: boolean }[] }): JSX.Element {
  return (
    <dl className="vc-readouts">
      {items.map((item) => (
        <div key={item.label} className="vc-readout vc-cut">
          <dt>{item.label}</dt>
          <dd className="vc-readout__value">{item.value}</dd>
          {item.change ? (
            <dd className="vc-readout__change" data-tone={item.good ? 'positive' : undefined}>
              {item.good ? (
                <span className="vc-icon" aria-hidden="true">
                  <ArrowUpIcon />
                </span>
              ) : null}
              {item.change}
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

/* Orders table (sortable) ----------------------------------------------------------------------------------------- */
export interface Order {
  id: string
  date: string
  items: number
  total: number
  status: StatusTone
  statusText: string
}

export function OrdersTable({ orders }: { orders: readonly Order[] }): JSX.Element {
  const [sort, setSort] = useState<{ key: 'date' | 'total'; dir: 'ascending' | 'descending' }>({ key: 'date', dir: 'descending' })
  const rows = [...orders].sort((a, b) => {
    const d = sort.key === 'date' ? a.date.localeCompare(b.date) : a.total - b.total
    return sort.dir === 'ascending' ? d : -d
  })
  const header = (key: 'date' | 'total', label: string, num?: boolean) => (
    <th scope="col" aria-sort={sort.key === key ? sort.dir : undefined} data-num={num || undefined}>
      <button type="button" onClick={() => setSort({ key, dir: sort.key === key && sort.dir === 'descending' ? 'ascending' : 'descending' })}>
        {label}
        {sort.key === key ? <span className="vc-icon" aria-hidden="true">{sort.dir === 'descending' ? <ArrowDownIcon /> : <ArrowUpIcon />}</span> : null}
      </button>
    </th>
  )
  return (
    <div className="vc-table-wrap" tabIndex={0} role="region" aria-label="Your orders">
      <table className="vc-table">
        <caption className="vc-sr">Your orders</caption>
        <thead>
          <tr>
            <th scope="col">Order</th>
            {header('date', 'Date')}
            <th scope="col" data-num>
              Items
            </th>
            {header('total', 'Total', true)}
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td>
                <a className="vc-link vc-mono" href={`#order-${order.id}`}>
                  {order.id}
                </a>
              </td>
              <td className="vc-num">{order.date}</td>
              <td data-num>{order.items}</td>
              <td data-num>{money(order.total)}</td>
              <td>
                <StatusTag tone={order.status}>{order.statusText}</StatusTag>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Summary list ---------------------------------------------------------------------------------------------------- */
export function SummaryList({ subtotal, save, tax, region = 'DE', busy }: { subtotal: number; save: number; tax: number; region?: string; busy?: boolean }): JSX.Element {
  return (
    <div className="vc-stack">
    <dl className="vc-dl" data-busy={busy || undefined} aria-busy={busy || undefined}>
      <div>
        <dt>Subtotal</dt>
        <dd>{money(subtotal)}</dd>
      </div>
      {save > 0 ? (
        <div data-row="save">
          <dt>You save</dt>
          <dd>{money(save)}</dd>
        </div>
      ) : null}
      <div>
        <dt>Tax ({region})</dt>
        <dd>{money(tax)}</dd>
      </div>
      <div data-row="total">
        <dt>Total</dt>
        <dd>{money(subtotal + tax)}</dd>
      </div>
    </dl>
      {/* The line's space is always kept, so the total never pushes Check out down. */}
      <p className="vc-price__busy" data-on={busy || undefined}>
        {busy ? (
          <>
            <Spinner size="sm" /> Updating total…
          </>
        ) : null}
      </p>
    </div>
  )
}

/* Cart line ------------------------------------------------------------------------------------------------------- */
export function CartLine({ game, qty, onQty, onRemove, busy, message, readOnly, autorun }: { game: Game; qty: number; onQty?: (n: number) => void; onRemove?: () => void; busy?: boolean; message?: ReactNode; readOnly?: boolean; autorun?: boolean }): JSX.Element {
  return (
    <li className="vc-line">
      <div className="vc-line__thumb">
        <CoverArt game={game} small />
      </div>
      <div className="vc-stack">
        <h3 className="vc-line__title" tabIndex={-1} data-line-title={game.id}>
          {game.title}
        </h3>
        <div className="vc-row">
          <PlatformTag platform={game.platform} />
          <RegionTag region={game.region} />
        </div>
      </div>
      <div className="vc-line__controls" data-autorun-scope={autorun || undefined}>
        {readOnly ? <span className="vc-num vc-muted">× {qty}</span> : <QuantityStepper game={game.title} value={qty} onChange={(n) => onQty?.(n)} onRemove={() => onRemove?.()} />}
        <PriceReadout size="line" price={game.price * qty} list={game.list * qty} busy={busy} />
      </div>
      {message ? <div className="vc-line__msg">{message}</div> : null}
    </li>
  )
}

/* Tier cards and track -------------------------------------------------------------------------------------------- */
export interface Edition {
  id: string
  name: string
  price: number
  list: number
  skips: number
  includes: readonly string[]
  soldOut?: boolean
}

export function TierPicker({ editions, value, onChange }: { editions: readonly Edition[]; value: string; onChange: (id: string) => void }): JSX.Element {
  const name = useId()
  return (
    <fieldset className="vc-tiers">
      <legend className="vc-sr">Choose an edition</legend>
      {editions.map((edition) => (
        <label key={edition.id} className="vc-tier vc-cut">
          <input type="radio" name={name} value={edition.id} checked={edition.id === value} disabled={edition.soldOut} onChange={() => onChange(edition.id)} />
          <span className="vc-tier__name">
            {edition.name}
            {edition.id === value ? (
              <span className="vc-tier__selected">
                <CheckIcon /> Selected
              </span>
            ) : null}
          </span>
          <ul>
            {edition.includes.map((line) => (
              <li key={line}>
                <span className="vc-icon" aria-hidden="true">
                  <CheckIcon />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <span className="vc-muted">{edition.skips ? `+${edition.skips} tiers at once` : 'Earn every tier by playing'}</span>
          <Charge segments={4} on={Math.round((edition.skips / 25) * 4)} />
          {edition.soldOut ? <StatusTag tone="negative">Sold out</StatusTag> : <PriceReadout price={edition.price} list={edition.list} />}
        </label>
      ))}
    </fieldset>
  )
}

export function Charge({ segments, on }: { segments: number; on: number }): JSX.Element {
  return (
    <span className="vc-charge" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} data-on={i < on} style={{ '--i': i } as CSSProperties} />
      ))}
    </span>
  )
}

export function TierTrack({ unlocked, rewards }: { unlocked: number; rewards: Readonly<Record<number, string>> }): JSX.Element {
  const scroller = useRef<HTMLDivElement>(null)
  const by = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.5, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  return (
    <div className="vc-track">
      <p>
        {unlocked ? `Tiers 1–${unlocked} come at once; ${unlocked + 1}–100 you earn by playing.` : 'Every tier, 1–100, is earned by playing.'}
      </p>
      <div className="vc-row">
        <Button variant="secondary" onClick={() => by(-1)}>
          Earlier tiers
        </Button>
        <Button variant="secondary" onClick={() => by(1)}>
          Later tiers
        </Button>
      </div>
      <div ref={scroller} className="vc-track__scroll" tabIndex={0} role="region" aria-label="Tier track, 1 to 100">
        <div className="vc-track__rows" aria-hidden="true">
          {Array.from({ length: 10 }, (_, g) => (
            <div key={g} className="vc-track__group">
              <span>
                {g * 10 + 1}–{g * 10 + 10}
              </span>
              <Charge segments={10} on={Math.max(0, Math.min(10, unlocked - g * 10))} />
              <span className="vc-track__reward">{rewards[(g + 1) * 10] ?? ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Code receipt (the signature): issuing → decode → delivered; or failed ------------------------------------------ */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const noise = (n: number) => Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('')

export type ReceiptState = 'issuing' | 'slow' | 'delivered' | 'failed' | 'hidden' | 'cancelled'

export function CodeReceipt({ state, code, game, platform, order, step = 0, onRetry, onCancel }: { state: ReceiptState; code: string; game: string; platform: string; order: string; step?: number; onRetry?: () => void; onCancel?: () => void }): JSX.Element {
  const groups = code.split('-')
  const [revealed, setRevealed] = useState(state === 'delivered' ? groups.length : 0)
  const [shown, setShown] = useState(state !== 'hidden')
  const codeId = useId()
  useEffect(() => {
    if (state !== 'delivered') {
      setRevealed(0)
      return
    }
    if (prefersReducedMotion()) {
      setRevealed(groups.length)
      return
    }
    setRevealed(0)
    const timers = groups.map((_, i) => window.setTimeout(() => setRevealed(i + 1), 120 + i * 60))
    return () => timers.forEach(window.clearTimeout)
  }, [state, code]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setShown(state !== 'hidden'), [state])
  const statusTone = state === 'delivered' || state === 'hidden' ? 'positive' : state === 'failed' ? 'negative' : state === 'cancelled' ? 'neutral' : 'info'
  const statusText = state === 'delivered' || state === 'hidden' ? 'Delivered' : state === 'failed' ? 'Not issued' : state === 'cancelled' ? 'Cancelled' : 'Issuing your code'
  const stages = ['Reserved', 'Issued', 'Sending']
  return (
    <div className="vc-stack vc-stack--group">
      <div className="vc-row">
        <StatusTag tone={statusTone}>{statusText}</StatusTag>
        {state === 'issuing' || state === 'slow' ? (
          <span className="vc-muted" aria-hidden="true">
            {stages[Math.min(step, 2)]}
          </span>
        ) : null}
      </div>
      {/* The status block keeps one height in every state, so the receipt below never moves when the key lands. */}
      <div className="vc-stack vc-receipt-status">
        <Charge segments={3} on={state === 'delivered' || state === 'hidden' ? 3 : state === 'issuing' || state === 'slow' ? Math.min(step + 1, 2) : 0} />
        <div className="vc-row">
          <p className="vc-muted">
            {state === 'slow'
              ? "This can take up to 5 minutes. You can leave this page; we'll email the code too."
              : state === 'issuing'
                ? 'Codes usually arrive in about 1 min.'
                : state === 'delivered' || state === 'hidden'
                  ? "Delivered. We've emailed it too."
                  : state === 'cancelled'
                    ? 'Order cancelled. $71.47 refunded within 3 days.'
                    : 'The code was not issued. What happens next is below.'}
          </p>
          {state === 'slow' && onCancel ? (
            <Button variant="secondary" onClick={onCancel}>
              Cancel order and refund
            </Button>
          ) : null}
        </div>
      </div>
      {state === 'cancelled' ? null : state === 'failed' ? (
        <InlineMessage tone="error" title="We couldn't issue your code" action={onRetry ? <Button variant="secondary" onClick={onRetry}>Try again now</Button> : undefined}>
          You'll get a full refund within 3 days, or we can try again now. Order <span className="vc-mono">{order}</span>.
        </InlineMessage>
      ) : (
        <article className="vc-receipt" aria-label={`Receipt for order ${order}`} aria-busy={state === 'issuing' || state === 'slow'}>
          <div className="vc-receipt__head">
            <span className="vc-logo" aria-hidden="true">
              <LogoMark />
              <Wordmark />
            </span>
            <span>
              Order <span className="vc-mono">{order}</span> · Oct 23, 2026
            </span>
          </div>
          <p className="vc-receipt__title">
            {game} · {platform}
          </p>
          {shown ? (
            <>
              <p className="vc-receipt__code" id={codeId} aria-hidden={state !== 'delivered' || undefined}>
                {groups.map((group, i) => (
                  <span key={i} className="vc-receipt__group" data-state={state === 'delivered' && i < revealed ? 'real' : 'noise'}>
                    {state === 'delivered' && i < revealed ? group : noise(group.length)}
                    {i < groups.length - 1 ? '-' : ''}
                  </span>
                ))}
              </p>
              {state === 'delivered' ? <span className="vc-sr">Code: {code}</span> : null}
            </>
          ) : (
            <p className="vc-receipt__code">•••••-•••••-•••••-•••••-•••••</p>
          )}
          <div className="vc-row vc-receipt-actions">
            {state === 'delivered' && shown ? <CopyButton text={code} what={game} targetId={codeId} large /> : null}
            {state === 'hidden' || (state === 'delivered' && !shown) ? (
              <Button variant="secondary" aria-expanded={shown} onClick={() => setShown((v) => !v)}>
                {shown ? 'Hide code' : 'Show code'}
              </Button>
            ) : null}
          </div>
          <Accordion title="How to redeem">
            <ol>
              <li>This is a {platform === 'PC' ? 'Steam' : platform} key.</li>
              <li>Open {platform === 'PC' ? 'Steam' : platform} and go to “Activate a product”.</li>
              <li>Paste the code and confirm.</li>
              <li>The game appears in your library there.</li>
            </ol>
          </Accordion>
          <p className="vc-receipt__meta">Keys are for personal use. Refunds before you reveal a code. Sample data: nothing here can be redeemed.</p>
        </article>
      )}
    </div>
  )
}

/* Chart set ------------------------------------------------------------------------------------------------------- */
export function PriceChart({ points, compare, title = 'Price over the last 90 days' }: { points: readonly number[]; compare?: readonly number[]; title?: string }): JSX.Element {
  const [focus, setFocus] = useState<number | null>(null)
  const [table, setTable] = useState(false)
  const W = 600
  const H = 220
  const pad = { l: 44, r: 16, t: 16, b: 28 }
  const all = [...points, ...(compare ?? [])]
  const max = Math.ceil(Math.max(...all) / 10) * 10
  const min = Math.max(0, Math.floor(Math.min(...all) / 10) * 10 - 10)
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b)
  const path = (vals: readonly number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const lowIdx = points.indexOf(Math.min(...points))
  const nowIdx = points.length - 1
  const day = (i: number) => {
    const d = new Date('2026-07-25T00:00:00')
    d.setDate(d.getDate() + Math.round((i / (points.length - 1)) * 90))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const summary = `Lowest ${money(points[lowIdx])} on ${day(lowIdx)}. Now ${money(points[nowIdx])}.`
  const ticks = [min, (min + max) / 2, max]
  return (
    <figure className="vc-chart" style={{ margin: 0 }}>
      <figcaption className="vc-row" style={{ justifyContent: 'space-between' }}>
        <h3 className="vc-chart__title">{title}</h3>
        <Button variant="quiet" aria-pressed={table} onClick={() => setTable((v) => !v)}>
          {table ? 'Show as chart' : 'Show as table'}
        </Button>
      </figcaption>
      {compare ? (
        <ul className="vc-legend">
          <li>
            <svg viewBox="0 0 28 12" aria-hidden="true">
              <path d="M0 6H28" className="vc-chart__line" />
            </svg>
            Standard edition
          </li>
          <li>
            <svg viewBox="0 0 28 12" aria-hidden="true">
              <path d="M0 6H28" className="vc-chart__line" data-series="2" />
            </svg>
            Deluxe edition
          </li>
        </ul>
      ) : null}
      {table ? (
        <div className="vc-table-wrap" tabIndex={0} role="region" aria-label="Price history table">
          <table className="vc-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col" data-num>
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i}>
                  <td>{day(i)}</td>
                  <td data-num>{money(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${title}. ${summary} Arrow keys move between points.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line className="vc-chart__grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
              <text className="vc-chart__axis" x={pad.l - 8} y={y(t) + 4} textAnchor="end">
                ${t}
              </text>
            </g>
          ))}
          {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((i) => (
            <text key={i} className="vc-chart__axis" x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
              {day(i)}
            </text>
          ))}
          <g className="vc-chart__reveal">
            {compare ? <path className="vc-chart__line" data-series="2" d={path(compare)} /> : null}
            <path className="vc-chart__line" d={path(points)} />
          </g>
          <circle className="vc-chart__low" cx={x(lowIdx)} cy={y(points[lowIdx])} r="5" />
          <text className="vc-chart__label" x={x(lowIdx)} y={y(points[lowIdx]) + 20} textAnchor="middle">
            Lowest {money(points[lowIdx])}
          </text>
          <rect className="vc-chart__now" x={x(nowIdx) - 5} y={y(points[nowIdx]) - 5} width="10" height="10" />
          {points.map((p, i) => (
            <circle
              key={i}
              className="vc-chart__point"
              role="img"
              cx={x(i)}
              cy={y(p)}
              r="8"
              tabIndex={i === 0 || focus === i ? 0 : -1}
              aria-label={`${day(i)}: ${money(p)}`}
              onFocus={() => setFocus(i)}
              onPointerEnter={() => setFocus(i)}
              onKeyDown={(event) => {
                const to = event.key === 'ArrowRight' ? Math.min(points.length - 1, i + 1) : event.key === 'ArrowLeft' ? Math.max(0, i - 1) : -1
                if (to < 0) return
                event.preventDefault()
                setFocus(to)
                ;((event.currentTarget.parentNode as SVGElement).querySelectorAll('.vc-chart__point')[to] as SVGElement).focus()
              }}
            />
          ))}
        </svg>
      )}
      <p className="vc-chart__tip vc-cut" aria-live="polite">
        {focus === null ? summary : `${day(focus)}: ${money(points[focus])}`}
      </p>
    </figure>
  )
}

export function SavingsBars({ months }: { months: readonly { label: string; value: number }[] }): JSX.Element {
  const W = 480
  const H = 180
  const max = Math.max(...months.map((m) => m.value), 1)
  const bw = (W - 40) / months.length
  return (
    <figure className="vc-chart" style={{ margin: 0 }}>
      <figcaption>
        <h3 className="vc-chart__title">Saved by month</h3>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Saved by month. ${months.map((m) => `${m.label} ${money(m.value)}`).join(', ')}.`}>
        <line className="vc-chart__grid" x1="20" x2={W - 20} y1={H - 24} y2={H - 24} />
        {months.map((m, i) => {
          const h = (m.value / max) * (H - 48)
          return (
            <g key={m.label}>
              <rect className="vc-chart__bar" style={{ animationDelay: `calc(${i} * var(--stagger-ui))` }} x={20 + i * bw + bw * 0.2} y={H - 24 - h} width={bw * 0.6} height={h} />
              <text className="vc-chart__axis" x={20 + i * bw + bw / 2} y={H - 8} textAnchor="middle">
                {m.label}
              </text>
              <text className="vc-chart__label" x={20 + i * bw + bw / 2} y={H - 30 - h} textAnchor="middle">
                {money(m.value).replace('.00', '')}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

export function PlatformRing({ parts }: { parts: readonly { label: string; value: number; color: 'data-1' | 'data-2' | 'data-3' | 'muted' }[] }): JSX.Element {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const r = 50
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <figure className="vc-chart" style={{ margin: 0 }}>
      <figcaption>
        <h3 className="vc-chart__title">Library by platform</h3>
      </figcaption>
      <div className="vc-row" style={{ gap: 'var(--gap-group)' }}>
        <svg viewBox="0 0 140 140" style={{ inlineSize: '9rem' }} role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
          {parts.map((p) => {
            const len = (p.value / total) * c
            const seg = (
              <circle key={p.label} className="vc-chart__ring" cx="70" cy="70" r={r} stroke={`var(--${p.color})`} strokeDasharray={`${len - 3} ${c - len + 3}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />
            )
            offset += len
            return seg
          })}
        </svg>
        <ul className="vc-legend" style={{ display: 'grid' }}>
          {parts.map((p) => (
            <li key={p.label}>
              <span style={{ inlineSize: 'var(--space-3)', blockSize: 'var(--space-3)', background: `var(--${p.color})` }} aria-hidden="true" />
              {p.label} <strong className="vc-num">{p.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
