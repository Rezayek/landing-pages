/**
 * VOLTCART scenarios: the system's components put together into the store's real flows (INTERACTION.md, Action
 * table, rows S1-S12), so the whole loading → waiting → result story can be seen and tuned before any page exists.
 * Each is driven by the /system toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * Words come from CONTENT.md. All games, prices and orders are invented sample data. Each scenario root carries
 * `data-scenario="<id>"`, which is how capture scripts find it.
 */
import { useEffect, useRef, useState, type ComponentType, type FormEvent, type JSX } from 'react'
import { ActionButton, EmptyState, ErrorState, InlineMessage, Region, announce } from '../feedback'
import { SimulatedFailure, isAbort, presetFor, simulate, wait, type LatencyId } from '../latency'
import {
  Banner,
  Button,
  CartLine,
  Checkbox,
  CodeInput,
  CodeReceipt,
  Dialog,
  ErrorSummary,
  FilterChip,
  GAMES,
  GameCard,
  GameCardSkeleton,
  MenuButton,
  OrdersTable,
  PasswordInput,
  PriceChart,
  PriceReadout,
  RadioGroup,
  RangeSlider,
  SearchInput,
  StepIndicator,
  SummaryList,
  Switch,
  Tabs,
  TextInput,
  TierPicker,
  TierTrack,
  WishlistToggle,
  type Edition,
  type Game,
  type Order,
  type ReceiptState,
} from '../components'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
  /** Set when the page was opened with `?latency=` and the scenario scrolled into view: run its main action once,
   * so a capture shows the wait, the result or the failure without a click. */
  autorun?: boolean
  /** The page is in autorun mode (`?latency=`): a scenario that would start on its own waits for `autorun`. */
  waitForAutorun?: boolean
}

/** Click the scenario's `[data-autorun]` control once, 300 ms after `enabled` turns on. */
function useAutoClick(enabled: boolean | undefined): (node: HTMLElement | null) => void {
  const root = useRef<HTMLElement | null>(null)
  const done = useRef(false)
  useEffect(() => {
    if (!enabled || done.current) return
    done.current = true
    const t = window.setTimeout(() => {
      const target = root.current?.querySelector<HTMLElement>('[data-autorun], [data-autorun-scope] [data-autorun-target]')
      const button = target?.matches('button, input') ? target : target?.querySelector<HTMLElement>('button, input')
      button?.click()
    }, 300)
    return () => window.clearTimeout(t)
  }, [enabled])
  return (node) => {
    root.current = node
  }
}

export interface ScenarioEntry {
  readonly id: string
  readonly title: string
  readonly summary: string
  /** What the standard says should happen: the reviewer checks the screen against this. */
  readonly watch: string
}

/** Thrown when the network control is offline: the request never reaches the server. */
export class OfflineError extends Error {
  constructor() {
    super('Not connected.')
    this.name = 'OfflineError'
  }
}

/** A simulated request that respects all three controls. */
async function request<T>(props: ScenarioProps, results: T, empty: T, signal?: AbortSignal): Promise<T> {
  if (props.network === 'offline') {
    await wait(120, signal)
    throw new OfflineError()
  }
  return simulate(props.latency, props.outcome === 'empty' ? empty : results, signal)
}

/** CONTENT.md, Errors: what failed, what is safe, what to do. */
function failureText(error: unknown, what: string, safe: string): string {
  if (error instanceof OfflineError) return what.startsWith('loading ') ? `You're not connected. ${safe}` : `You're not connected, so ${what} didn't happen. ${safe}`
  // A region's title already says what didn't load ("Games didn't load"), so its body only says what is safe.
  if (error instanceof SimulatedFailure) return what.startsWith('loading ') ? `${safe} Try again.` : `${what[0].toUpperCase()}${what.slice(1)} didn't work. ${safe} Try again.`
  return `This is taking too long and was stopped. Nothing was lost. Try again.`
}

const money = (n: number) => `$${n.toFixed(2)}`

// ---------------------------------------------------------------------------------------------------------------
// S1. Search the catalogue: debounced, earlier requests aborted, results / no results / failure, offline
// ---------------------------------------------------------------------------------------------------------------
function SearchScenario(props: ScenarioProps): JSX.Element {
  const [query, setQuery] = useState('neon')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<readonly Game[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)
  const debounce = useRef<number | undefined>(undefined)

  async function run(term: string, signal?: AbortSignal): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setBusy(true)
    setError(null)
    try {
      const t = term.trim().toLowerCase()
      const found = await request(props, GAMES.filter((g) => g.title.toLowerCase().includes(t)), [], own.signal)
      setResults(found)
      announce(found.length ? `${found.length} result${found.length === 1 ? '' : 's'} for “${term}”` : `No results for “${term}”`)
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  useEffect(() => () => {
    controller.current?.abort()
    window.clearTimeout(debounce.current)
  }, [])

  useEffect(() => {
    if (props.autorun) void run(query)
  }, [props.autorun]) // eslint-disable-line react-hooks/exhaustive-deps

  function onChange(value: string): void {
    setQuery(value)
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => void run(value), 250)
  }

  return (
    <div className="vc-stack vc-stack--group" data-scenario="search">
      <SearchInput value={query} onChange={onChange} busy={busy} onSubmit={() => void run(query)} shortcut={false} />
      {error ? (
        <ErrorState title="Search didn't finish" onRetry={(signal) => run(query, signal)} focusOnMount={false}>
          {failureText(error, 'the search', 'Your query is still here.')}
        </ErrorState>
      ) : (
        <Region
          label="results"
          busy={busy}
          hasContent={results !== null}
          fallback={
            <div className="vc-grid">
              {Array.from({ length: Math.min(3, Math.max(1, results?.length ?? 1)) }, (_, i) => (
                <GameCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {results === null ? (
            <p className="vc-muted">Type to search, or press Enter.</p>
          ) : results.length ? (
            <div className="vc-grid">
              {results.slice(0, 3).map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          ) : (
            <EmptyState kind="no-results" title={`No results for “${query}”`} action={<Button variant="secondary" onClick={() => onChange('')}>Search all games</Button>}>
              Check the spelling or search for a genre.
            </EmptyState>
          )}
        </Region>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S2. Filter the catalogue: old results kept and dimmed, chips, count, no results with clear filters
// ---------------------------------------------------------------------------------------------------------------
const PLATFORMS = ['PC', 'PS5', 'XBOX', 'SWITCH'] as const
type Sort = 'discount' | 'price' | 'new'

function FilterScenario(props: ScenarioProps): JSX.Element {
  const [platforms, setPlatforms] = useState<readonly string[]>(['PC'])
  const [range, setRange] = useState<[number, number]>([0, 70])
  const [regionOnly, setRegionOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('discount')
  const [busy, setBusy] = useState(false)
  const [list, setList] = useState<readonly Game[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)
  const timer = useRef<number | undefined>(undefined)

  async function apply(signal?: AbortSignal): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setBusy(true)
    setError(null)
    try {
      const matched = GAMES.filter((g) => (platforms.length === 0 || platforms.includes(g.platform)) && g.price >= range[0] && g.price <= range[1] && (!regionOnly || g.regionOk))
      const found = await request(props, matched, [], own.signal)
      setList(found)
      announce(found.length ? `${found.length} game${found.length === 1 ? '' : 's'}` : 'No games match these filters')
    } catch (failure) {
      if (!isAbort(failure)) {
        setError(failure)
        announce("Games didn't load. Your filters are kept.")
      }
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  useEffect(() => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void apply(), 300)
    return () => window.clearTimeout(timer.current)
  }, [platforms, range, regionOnly, sort, props.latency, props.outcome, props.network]) // eslint-disable-line react-hooks/exhaustive-deps

  const auto = useAutoClick(props.autorun && list !== null)
  const chips = [...platforms.map((p) => ({ id: p, label: p, remove: () => setPlatforms(platforms.filter((x) => x !== p)) })), ...(regionOnly ? [{ id: 'region', label: 'Works in my region', remove: () => setRegionOnly(false) }] : []), ...(range[0] > 0 || range[1] < 70 ? [{ id: 'price', label: `$${range[0]}–$${range[1]}`, remove: () => setRange([0, 70]) }] : [])]
  const clear = () => {
    setPlatforms([])
    setRegionOnly(false)
    setRange([0, 70])
  }

  return (
    <div className="vc-stack vc-stack--group" data-scenario="filter" data-density="compact" ref={auto}>
      <div className="vc-row" style={{ alignItems: 'flex-start', gap: 'var(--gap-group)' }}>
        <div className="vc-filters">
          <fieldset className="vc-fieldset vc-fieldset--compact">
            <legend>Platform</legend>
            {PLATFORMS.map((p) => (
              <span key={p} data-autorun={p === 'PS5' || undefined} style={{ display: 'contents' }}>
              <Checkbox label={p === 'XBOX' ? 'Xbox' : p === 'SWITCH' ? 'Switch' : p} count={GAMES.filter((g) => g.platform === p).length} checked={platforms.includes(p)} onChange={(on) => setPlatforms(on ? [...platforms, p] : platforms.filter((x) => x !== p))} />
              </span>
            ))}
          </fieldset>
          <RangeSlider legend="Price" min={0} max={70} low={range[0]} high={range[1]} onChange={(lo, hi) => setRange([lo, hi])} />
          <Checkbox label="Works in my region" description="Germany" checked={regionOnly} onChange={setRegionOnly} />
        </div>
        <div className="vc-stack vc-stack--group" style={{ flex: '1 1 20rem', minInlineSize: 0 }}>
          <div className="vc-row" style={{ justifyContent: 'space-between' }}>
            <p className="vc-num" aria-hidden="true">
              {list ? `${list.length} games` : ' '}
            </p>
            <MenuButton<Sort> label="Sort" value={sort} onChange={setSort} options={[{ id: 'discount', label: 'Biggest discount' }, { id: 'price', label: 'Lowest price' }, { id: 'new', label: 'Newest' }]} />
          </div>
          {chips.length ? (
            <div className="vc-row">
              {chips.map((chip) => (
                <FilterChip key={chip.id} label={chip.label} onRemove={() => { chip.remove(); announce(`Filter removed: ${chip.label}`) }} />
              ))}
              {list && list.length === 0 ? null : (
                <Button variant="quiet" onClick={clear}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : null}
          {error && !list ? (
            <ErrorState title="Games didn't load" onRetry={(signal) => apply(signal)} focusOnMount={false} announceOnMount={false}>
              {failureText(error, 'loading games', 'Your filters are kept.')}
            </ErrorState>
          ) : (
            <>
              {error ? <InlineMessage tone="error" title="Results didn't refresh">{failureText(error, 'refreshing the results', 'The list below is from before.')}</InlineMessage> : null}
              <Region label="games" busy={busy} hasContent={list !== null} minHeight="16rem" fallback={<div className="vc-grid"><GameCardSkeleton /><GameCardSkeleton /><GameCardSkeleton /></div>}>
                {list && list.length ? (
                  <div className="vc-grid">
                    {list.map((g) => (
                      <GameCard key={g.id} game={g} />
                    ))}
                  </div>
                ) : (
                  <EmptyState kind="no-results" title="No games match these filters" filters={chips.map((c) => c.label)} action={<Button variant="secondary" onClick={clear}>Clear filters</Button>}>
                    Try removing one.
                  </EmptyState>
                )}
              </Region>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S3. Add to cart from the game page: pending in the button, count updates, sold out and price changed inline
// ---------------------------------------------------------------------------------------------------------------
function AddToCartScenario(props: ScenarioProps): JSX.Element {
  const game = GAMES[0]
  const [count, setCount] = useState(2)
  const auto = useAutoClick(props.autorun)
  return (
    <div className="vc-stack vc-stack--group" data-scenario="add-to-cart" ref={auto}>
      <p className="vc-muted vc-num" aria-hidden="true">
        Cart: {count} items
      </p>
      <PriceReadout size="large" price={game.price} list={game.list} lowest />
      <div className="vc-row">
        <ActionButton
          data-autorun
          variant="primary"
          pendingLabel="Adding…"
          slowLabel="Still adding…"
          successLabel="Added"
          successMessage={`Added ${game.title} to your cart. Cart: ${count} items.`}
          errorMessage={(error) => (error instanceof OfflineError ? "You're not connected. Adding needs a connection to check stock." : "We couldn't add it. Your cart didn't change. Try again.")}
          onAction={(signal) => request(props, true, true, signal)}
          onSuccess={() => setCount((c) => c + 1)}
        >
          Add to cart
        </ActionButton>
        <WishlistToggle game={game.title} saved={false} withLabel onSave={(next) => request(props, next, next)} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S4. Wishlist: optimistic toggles, rollback with a reason, removal with Undo and a "Recently removed" row
// ---------------------------------------------------------------------------------------------------------------
function WishlistScenario(props: ScenarioProps): JSX.Element {
  const [items, setItems] = useState<readonly Game[]>(GAMES.slice(1, 4))
  const [removed, setRemoved] = useState<Game | null>(null)
  const shown = props.outcome === 'empty' ? [] : items
  const auto = useAutoClick(props.autorun)
  const wishEmpty = shown.length === 0
  useEffect(() => {
    if (props.waitForAutorun && !props.autorun) return
    if (wishEmpty) announce('Nothing saved on your wishlist yet.')
  }, [wishEmpty, props.autorun, props.waitForAutorun])
  function remove(game: Game): void {
    setItems((list) => list.filter((g) => g.id !== game.id))
    setRemoved(game)
    announce(`Removed ${game.title} from your wishlist. Undo is below the list.`)
  }
  function restore(game: Game): void {
    setItems((list) => (list.some((g) => g.id === game.id) ? list : [...list, game]))
    setRemoved(null)
    announce(`Restored ${game.title} to your wishlist`)
  }
  return (
    <div className="vc-stack vc-stack--group" data-scenario="wishlist" ref={auto}>
      {shown.length === 0 ? (
        <EmptyState kind="first-use" title="Nothing saved yet" action={<Button variant="secondary">Browse deals</Button>}>
          Hit the heart on a game to keep an eye on it.
        </EmptyState>
      ) : (
        <ul className="vc-stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {shown.map((game) => (
            <li key={game.id} className="vc-row" style={{ justifyContent: 'space-between', borderBlockEnd: 'var(--border) solid var(--line)', paddingBlock: 'var(--space-2)' }}>
              <span className="vc-display">{game.title}</span>
              <span className="vc-row" data-autorun={game.id === shown[0]?.id || undefined}>
                {game.soldOut ? <span className="vc-muted">Sold out</span> : <PriceReadout size="line" price={game.price} list={game.list} />}
                <WishlistToggle
                  game={game.title}
                  saved
                  onSave={async (next) => {
                    await request(props, next, next)
                    if (!next) remove(game)
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
      {removed ? (
        <p className="vc-row vc-muted">
          Recently removed: {removed.title}
          <Button variant="secondary" onClick={() => restore(removed)}>
            Undo
          </Button>
        </p>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S5. Price-drop alert: field validation, pending, inline success, the alert switch saves itself
// ---------------------------------------------------------------------------------------------------------------
function AlertScenario(props: ScenarioProps): JSX.Element {
  const game = GAMES[0]
  const [price, setPrice] = useState('19.99')
  const [touched, setTouched] = useState(false)
  const [set, setSet] = useState<string | null>(null)
  const n = Number(price)
  const auto = useAutoClick(props.autorun)
  const error = !price.trim() ? 'Enter a price for the alert' : Number.isNaN(n) ? 'Enter the price as a number, like 19.99' : n >= game.price ? `Set the alert below the current price of ${money(game.price)}` : undefined
  return (
    <div className="vc-stack vc-stack--group" data-scenario="alert" ref={auto}>
      <form className="vc-stack vc-stack--group" onSubmit={(e: FormEvent) => e.preventDefault()}>
        <TextInput label="Email me when the price is below" prefix="$" inputMode="decimal" value={price} onChange={(v) => { setPrice(v); setSet(null) }} onBlur={() => setTouched(true)} error={touched ? error : undefined} hint={`Now ${money(game.price)}. Lowest in 90 days: $19.99.`} />
        <div>
          <ActionButton
            data-autorun
            variant="secondary"
            type="submit"
            pendingLabel="Setting alert…"
            successLabel="Alert set"
            successMessage={false}
            onAction={async (signal) => {
              setTouched(true)
              if (error) throw new Error(error)
              await request(props, true, true, signal)
            }}
            errorMessage={(e) => (e instanceof Error && e.message === error ? error ?? '' : failureText(e, 'setting the alert', 'Nothing was saved.'))}
            onSuccess={() => {
              const text = `Alert set. We'll email you when ${game.title} drops below ${money(n)}.`
              setSet(text)
              announce(text)
            }}
          >
            Set alert
          </ActionButton>
        </div>
      </form>
      {set ? <InlineMessage tone="success">{set}</InlineMessage> : null}
      <Switch label={`Price alert for ${game.title}`} checked onSave={(next) => request(props, next, next)} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S6. Battle pass edition: tier cards (radio group) and the track charging; loads like any region
// ---------------------------------------------------------------------------------------------------------------
const EDITIONS: readonly Edition[] = [
  { id: 'standard', name: 'Standard', price: 7.99, list: 9.99, skips: 0, includes: ['All 100 tiers to earn', 'Season 4 rewards track'] },
  { id: 'premium', name: 'Premium', price: 14.99, list: 24.99, skips: 10, includes: ['Everything in Standard', '+10 tiers at once', 'Two exclusive skins'] },
  { id: 'premium-plus', name: 'Premium+', price: 22.49, list: 39.99, skips: 25, includes: ['Everything in Premium', '+25 tiers at once', 'Season bonus XP'] },
]

function BattlePassScenario(props: ScenarioProps): JSX.Element {
  const [edition, setEdition] = useState('premium')
  const [busy, setBusy] = useState(!props.waitForAutorun) // a region waiting to start in autorun mode is not loading yet
  const [loaded, setLoaded] = useState<readonly Edition[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  async function load(signal?: AbortSignal): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      setLoaded(await request(props, EDITIONS, EDITIONS.map((e) => ({ ...e, soldOut: e.id !== 'standard' })), signal))
    } catch (e) {
      if (!isAbort(e)) {
        setError(e)
        announce("Editions didn't load. Try again.")
      }
    } finally {
      // An aborted run (a newer load replaced it) must not end the newer one's wait.
      if (!signal?.aborted) setBusy(false)
    }
  }
  useEffect(() => {
    if (props.waitForAutorun && !props.autorun) return // in autorun mode the load starts in view
    const c = new AbortController()
    void load(c.signal)
    return () => c.abort()
  }, [props.latency, props.outcome, props.network, props.autorun]) // eslint-disable-line react-hooks/exhaustive-deps
  const chosen = loaded?.find((e) => e.id === edition)
  const auto = useAutoClick(props.autorun && loaded !== null)
  return (
    <div className="vc-stack vc-stack--group" data-scenario="battle-pass" ref={auto}>
      {error ? (
        <ErrorState title="Editions didn't load" onRetry={(s) => load(s)} focusOnMount={false} announceOnMount={false}>
          {failureText(error, 'loading the editions', 'Your cart is safe.')}
        </ErrorState>
      ) : (
        <Region label="editions" busy={busy} hasContent={loaded !== null} preview={props.waitForAutorun && !props.autorun && loaded === null ? 'first-load' : undefined} minHeight="20rem" fallback={<div className="vc-grid"><GameCardSkeleton /><GameCardSkeleton /><GameCardSkeleton /></div>}>
          {loaded ? (
            <div className="vc-stack vc-stack--group">
              <TierPicker
                editions={loaded}
                value={edition}
                onChange={(id) => {
                  setEdition(id)
                  const e = loaded.find((x) => x.id === id)
                  if (e) announce(`${e.name} selected. ${e.skips ? `Tiers 1 to ${e.skips} come at once.` : 'Every tier is earned by playing.'}`)
                }}
              />
              <TierTrack unlocked={chosen?.skips ?? 0} rewards={{ 10: 'Skin', 30: 'Emote', 50: 'Banner', 100: 'Legend skin' }} />
              <div>
                <ActionButton data-autorun variant="primary" pendingLabel="Adding…" successLabel="Added" successMessage={`Added ${chosen?.name ?? ''} to your cart`} disabled={chosen?.soldOut} disabledReason="Sold out" onAction={(s) => request(props, true, true, s)}>
                  Add {chosen?.name} to cart
                </ActionButton>
              </div>
            </div>
          ) : null}
        </Region>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S7. Check out and pay: review, validation and error summary, pending → bank check → paid; declined kept inline
// ---------------------------------------------------------------------------------------------------------------
function CheckoutScenario(props: ScenarioProps): JSX.Element {
  const [email, setEmail] = useState(props.autorun ? 'dana@example.com' : 'dana@example')
  const auto = useAutoClick(props.autorun)
  useEffect(() => {
    if (props.autorun) setEmail('dana@example.com')
  }, [props.autorun])
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [method, setMethod] = useState<'card' | 'wallet'>('card')
  const [errors, setErrors] = useState<readonly { fieldId: string; text: string }[]>([])
  const [declined, setDeclined] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const emailError = !email.includes('@') || !/\.\w+$/.test(email) ? 'Email needs an @ and a domain, like name@example.com' : undefined
  if (paid) {
    return (
      <div data-scenario="checkout" className="vc-stack vc-stack--group">
        <StepIndicator current={3} />
        <h3 tabIndex={-1} className="vc-focus-target" ref={(el) => el?.focus()}>
          Order VC-48213 paid
        </h3>
        <p className="vc-muted">Your code is issuing below in the delivery scenario. We've emailed it too.</p>
        <Button variant="secondary" onClick={() => setPaid(false)}>
          Run checkout again
        </Button>
      </div>
    )
  }
  return (
    <form className="vc-stack vc-stack--group vc-form" data-scenario="checkout" ref={auto} onSubmit={(e) => e.preventDefault()} noValidate>
      <StepIndicator current={2} />
      <ErrorSummary errors={errors} />
      <TextInput fieldId="checkout-email" label="Email for your code" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors.length && emailError ? emailError : undefined} />
      <RadioGroup<'card' | 'wallet'> legend="Pay with" name="pay-method" value={method} onChange={setMethod} options={[{ id: 'card', label: 'Card', description: 'Visa, Mastercard, Amex' }, { id: 'wallet', label: 'Wallet', description: 'Apple Pay or Google Pay' }]} />
      {method === 'card' ? <TextInput fieldId="checkout-card" label="Card number" inputMode="numeric" autoComplete="cc-number" value={card} onChange={setCard} hint="Sample field: a real store uses the payment provider's hosted input." /> : null}
      <SummaryList subtotal={71.47} save={83.5} tax={0} />
      {declined ? (
        <InlineMessage tone="error" title="Payment declined">
          {declined}
        </InlineMessage>
      ) : null}
      <div>
        <ActionButton
          data-autorun
          variant="primary"
          type="submit"
          knownSlow
          inlineError={false}
          pendingLabel="Paying…"
          slowLabel="Waiting for your bank…"
          successLabel="Paid"
          timeoutMs={60000}
          successMessage="Order VC-48213 paid"
          errorMessage={(e) =>
            e instanceof Error && e.message === 'invalid'
              ? 'Fix the fields above to continue'
              : e instanceof OfflineError
                ? "You're not connected. You weren't charged."
                : "Your bank declined the payment. You weren't charged. Try another card, or pay with a wallet."
          }
          onAction={async (signal) => {
            setDeclined(null)
            const next = emailError ? [{ fieldId: 'checkout-email', text: emailError }] : []
            setErrors(next)
            if (next.length) throw new Error('invalid')
            try {
              await request(props, true, true, signal)
            } catch (e) {
              if (!isAbort(e) && !(e instanceof OfflineError)) setDeclined("Your bank declined the payment. You weren't charged. Try another card, or pay with a wallet.")
              throw e
            }
          }}
          onSuccess={() => window.setTimeout(() => setPaid(true), 600)}
        >
          Pay $71.47
        </ActionButton>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S8. Receive the code: a job (reserved → issued → delivered), the slow line, the decode, failure with refund
// ---------------------------------------------------------------------------------------------------------------
function DeliveryScenario(props: ScenarioProps): JSX.Element {
  const [state, setState] = useState<ReceiptState>('issuing')
  const [step, setStep] = useState(0)
  const [run, setRun] = useState(0)
  const cancelled = useRef<AbortController | null>(null)
  useEffect(() => {
    // In autorun mode the job starts when the card scrolls into view, so its stages are what a capture sees.
    if (props.waitForAutorun && !props.autorun) return
    const c = new AbortController()
    cancelled.current = c
    setState('issuing')
    setStep(0)
    const total = presetFor(props.latency).ms
    // Past 10 s the job is slow: the leave-this-page line and Cancel appear together.
    const slow = window.setTimeout(() => setState((s) => (s === 'issuing' ? 'slow' : s)), Math.min(10000, total * 0.7))
    const stages = [1, 2].map((s) => window.setTimeout(() => setStep(s), (total / 3) * s))
    announce('Issuing your code')
    request(props, true, true, c.signal)
      .then(() => {
        setState('delivered')
        announce('Your code is ready')
      })
      .catch((e) => {
        if (isAbort(e)) return
        setState('failed')
        announce("We couldn't issue your code. You'll get a full refund within 3 days.", 'assertive')
      })
      .finally(() => {
        window.clearTimeout(slow)
        stages.forEach(window.clearTimeout)
      })
    return () => {
      c.abort()
      window.clearTimeout(slow)
      stages.forEach(window.clearTimeout)
    }
  }, [props.latency, props.outcome, props.network, run, props.autorun]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="vc-stack vc-stack--group" data-scenario="delivery">
      <CodeReceipt
        state={state}
        step={step}
        code="7KQ4M-XP2RD-9HT6W-LC3VN-8BF5Y"
        game="Neon Drift"
        platform="PC"
        order="VC-48213"
        onRetry={() => setRun((r) => r + 1)}
        onCancel={() => {
          cancelled.current?.abort()
          setState('cancelled')
          announce('Order cancelled. $71.47 refunded within 3 days.')
        }}
      />
      <Button variant="secondary" onClick={() => setRun((r) => r + 1)}>
        Replay the delivery
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S10. Sign in: the dialog form, passwordless code, error summary; the interrupted action completes after
// ---------------------------------------------------------------------------------------------------------------
function SignInScenario(props: ScenarioProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'password' | 'code'>('password')
  const [email, setEmail] = useState('dana@example.com')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<readonly { fieldId: string; text: string }[]>([])
  const [signedIn, setSignedIn] = useState(false)
  const pwError = mode === 'password' && !password ? 'Enter your password' : undefined
  const codeError = mode === 'code' && code.length !== 6 ? `Sign-in codes have 6 numbers. ${6 - code.length} missing.` : undefined
  return (
    <div className="vc-stack vc-stack--group" data-scenario="sign-in">
      <p>{signedIn ? 'Signed in as Dana. Neon Drift is on your wishlist.' : 'Signed out. Saving to the wishlist asks you to sign in first.'}</p>
      <div>
        <Button variant="secondary" onClick={() => (signedIn ? setSignedIn(false) : setOpen(true))}>
          {signedIn ? 'Sign out' : 'Save Neon Drift to wishlist'}
        </Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Sign in to save" initialFocus="input" headingLevel={3}>
        <form className="vc-stack vc-stack--group" onSubmit={(e) => e.preventDefault()} noValidate>
          <ErrorSummary errors={errors} />
          <TextInput fieldId="signin-email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
          {mode === 'password' ? (
            <PasswordInput label="Password" value={password} onChange={setPassword} error={errors.some((e) => e.fieldId === 'signin-secret') ? pwError : undefined} />
          ) : (
            <CodeInput label="Sign-in code" numeric hint="We sent 6 numbers to your email." value={code} onChange={setCode} error={errors.some((e) => e.fieldId === 'signin-secret') ? codeError : undefined} />
          )}
          <Button variant="quiet" onClick={() => setMode(mode === 'password' ? 'code' : 'password')}>
            {mode === 'password' ? 'Email me a sign-in code instead' : 'Use my password instead'}
          </Button>
          <div className="vc-dialog__actions">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <ActionButton
              variant="primary"
              type="submit"
              pendingLabel="Signing in…"
              successLabel="Signed in"
              successMessage="Signed in. Saved Neon Drift to your wishlist."
              errorMessage={(e) => (e instanceof Error && e.message === 'invalid' ? 'Fix the field above to continue' : failureText(e, 'signing in', 'What you typed is kept.'))}
              onAction={async (signal) => {
                const err = pwError ?? codeError
                setErrors(err ? [{ fieldId: 'signin-secret', text: err }] : [])
                if (err) throw new Error('invalid')
                await request(props, true, true, signal)
              }}
              onSuccess={() => {
                setSignedIn(true)
                window.setTimeout(() => setOpen(false), 400)
              }}
            >
              Sign in
            </ActionButton>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S11. Library and orders: tabs per platform, the orders table, first use when empty
// ---------------------------------------------------------------------------------------------------------------
const ORDERS: readonly Order[] = [
  { id: 'VC-48213', date: '2026-10-23', items: 3, total: 71.47, status: 'positive', statusText: 'Delivered' },
  { id: 'VC-47790', date: '2026-10-02', items: 1, total: 14.99, status: 'positive', statusText: 'Delivered' },
  { id: 'VC-47105', date: '2026-09-11', items: 1, total: 49.99, status: 'info', statusText: 'Pre-order' },
  { id: 'VC-46021', date: '2026-08-19', items: 2, total: 22.98, status: 'neutral', statusText: 'Refunded' },
]

function LibraryScenario(props: ScenarioProps): JSX.Element {
  const [busy, setBusy] = useState(!props.waitForAutorun) // a region waiting to start in autorun mode is not loading yet
  const [data, setData] = useState<{ games: readonly Game[]; orders: readonly Order[] } | null>(null)
  const [error, setError] = useState<unknown>(null)
  async function load(signal?: AbortSignal): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const d = await request(props, { games: GAMES.slice(0, 3), orders: ORDERS }, { games: [], orders: [] }, signal)
      setData(d)
      announce(d.games.length ? `${d.games.length} games loaded` : 'No games in your library yet.')
    } catch (e) {
      if (!isAbort(e)) {
        setError(e)
        announce("Your library didn't load. Try again.")
      }
    } finally {
      // An aborted run (a newer load replaced it) must not end the newer one's wait.
      if (!signal?.aborted) setBusy(false)
    }
  }
  useEffect(() => {
    if (props.waitForAutorun && !props.autorun) return // in autorun mode the load starts in view
    const c = new AbortController()
    void load(c.signal)
    return () => c.abort()
  }, [props.latency, props.outcome, props.network, props.autorun]) // eslint-disable-line react-hooks/exhaustive-deps
  if (error) {
    return (
      <div data-scenario="library">
        <ErrorState title="Your library didn't load" onRetry={(s) => load(s)} focusOnMount={false} announceOnMount={false}>
          {failureText(error, 'loading your library', 'Your keys are safe.')}
        </ErrorState>
      </div>
    )
  }
  return (
    <div data-scenario="library">
      <Region
        label="library"
        busy={busy}
        hasContent={data !== null}
        preview={props.waitForAutorun && !props.autorun && data === null ? 'first-load' : undefined}
        fallback={
          // The same frame as the loaded view (tab row, then a grid of cards), so the swap moves nothing.
          <div aria-hidden="true">
            <div className="vc-tabs__list vc-tabs__list--skeleton">
              <span className="vc-tabs__tab">All</span>
              <span className="vc-tabs__tab">PS5</span>
              <span className="vc-tabs__tab">Orders</span>
            </div>
            <div className="vc-tabs__panel">
              <div className="vc-grid">
                <GameCardSkeleton />
                <GameCardSkeleton />
                <GameCardSkeleton />
              </div>
            </div>
          </div>
        }
      >
        {data ? (
          <Tabs label="Library and orders" tabs={[{ id: 'all', label: 'All', count: data.games.length }, { id: 'ps5', label: 'PS5', count: data.games.filter((g) => g.platform === 'PS5').length }, { id: 'orders', label: 'Orders', count: data.orders.length }]}>
            {(tab) => {
              if (tab === 'orders') {
                return data.orders.length ? (
                  <OrdersTable orders={data.orders} />
                ) : (
                  <EmptyState kind="first-use" title="No orders yet" action={<Button variant="secondary">Browse deals</Button>}>
                    Your receipts and codes will show here.
                  </EmptyState>
                )
              }
              const games = tab === 'ps5' ? data.games.filter((g) => g.platform === 'PS5') : data.games
              return games.length ? (
                <div className="vc-grid">
                  {games.map((g) => (
                    <GameCard key={g.id} game={g} variant="library" />
                  ))}
                </div>
              ) : (
                <EmptyState kind={tab === 'all' ? 'first-use' : 'no-results'} title={tab === 'all' ? 'No games yet' : 'No PS5 games'} action={<Button variant="secondary">{tab === 'all' ? 'Browse deals' : 'All games'}</Button>}>
                  {tab === 'all' ? 'Your keys will live here after your first order.' : 'Your PS5 keys will show here.'}
                </EmptyState>
              )
            }}
          </Tabs>
        ) : null}
      </Region>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S12. Not connected while browsing: the global banner, queued cart edits, "Connected again" with the sync
// ---------------------------------------------------------------------------------------------------------------
function OfflineScenario(props: ScenarioProps): JSX.Element {
  const [qty, setQty] = useState(1)
  const [queued, setQueued] = useState(0)
  const [back, setBack] = useState(false)
  const was = useRef(props.network)
  useEffect(() => {
    if (was.current === 'offline' && props.network === 'online') {
      setBack(true)
      announce(`Connected again. Your cart is synced${queued ? `: ${queued} change${queued === 1 ? '' : 's'} sent` : ''}.`)
      setQueued(0)
      const t = window.setTimeout(() => setBack(false), 3000)
      was.current = props.network
      return () => window.clearTimeout(t)
    }
    if (props.network === 'offline' && was.current !== 'offline') announce("You're not connected. Your cart is saved on this device.")
    was.current = props.network
  }, [props.network]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="vc-stack vc-stack--group" data-scenario="offline">
      {props.network === 'offline' ? (
        <Banner tone="warning" title="You're not connected.">
          Your cart is saved on this device. Paying needs a connection.
        </Banner>
      ) : back ? (
        <Banner tone="positive" title="Connected again.">
          Your cart is synced.
        </Banner>
      ) : (
        <p className="vc-muted">Set Network to “Offline” in the page settings to see the banner and queued edits.</p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <CartLine
          game={GAMES[1]}
          qty={qty}
          onQty={(n) => {
            setQty(n)
            if (props.network === 'offline') setQueued((q) => q + 1)
          }}
          message={props.network === 'offline' && queued ? <span className="vc-muted">{queued} change{queued === 1 ? '' : 's'} will be sent when you're connected.</span> : undefined}
        />
      </ul>
      <div>
        <Button variant="primary" disabledReason={props.network === 'offline' ? "Paying needs a connection. Your cart is saved." : undefined}>
          Check out
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// S2b. Game page price history: a region with its own skeleton, empty and error, and the chart's table view
// ---------------------------------------------------------------------------------------------------------------
const HISTORY = [59.99, 59.99, 44.99, 44.99, 39.99, 59.99, 29.99, 19.99, 24.99, 23.99]

function PriceHistoryScenario(props: ScenarioProps): JSX.Element {
  const [busy, setBusy] = useState(!props.waitForAutorun) // a region waiting to start in autorun mode is not loading yet
  const [points, setPoints] = useState<readonly number[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  async function load(signal?: AbortSignal): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      setPoints(await request(props, HISTORY, [], signal))
    } catch (e) {
      if (!isAbort(e)) {
        setError(e)
        announce("Price history didn't load.")
      }
    } finally {
      // An aborted run (a newer load replaced it) must not end the newer one's wait.
      if (!signal?.aborted) setBusy(false)
    }
  }
  useEffect(() => {
    if (props.waitForAutorun && !props.autorun) return // in autorun mode the load starts in view
    const c = new AbortController()
    void load(c.signal)
    return () => c.abort()
  }, [props.latency, props.outcome, props.network, props.autorun]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div data-scenario="price-history">
      {error ? (
        <ErrorState title="Price history didn't load" onRetry={(s) => load(s)} focusOnMount={false} announceOnMount={false}>
          {failureText(error, 'loading the price history', 'The price above is current.')}
        </ErrorState>
      ) : (
        <Region label="price history" busy={busy} hasContent={points !== null} preview={props.waitForAutorun && !props.autorun && points === null ? 'first-load' : undefined} minHeight="17rem" fallback={<div className="vc-stack"><span className="vc-muted">Price over the last 90 days</span><div style={{ blockSize: '12rem', background: 'var(--skeleton-bg)' }} /></div>}>
          {points && points.length ? (
            <PriceChart points={points} />
          ) : (
            <EmptyState kind="first-use" title="No price history yet">
              It starts the first time the price changes.
            </EmptyState>
          )}
        </Region>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// The cart: price changed and region warnings on the line, remove with Undo, live summary
// ---------------------------------------------------------------------------------------------------------------
function CartScenario(props: ScenarioProps): JSX.Element {
  const [lines, setLines] = useState(() => [
    { game: GAMES[0], qty: 1 },
    { game: GAMES[1], qty: 1, changedFrom: 12.99 },
    { game: GAMES[2], qty: 1 },
  ])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [removed, setRemoved] = useState<{ game: Game; qty: number } | null>(null)
  const shown = props.outcome === 'empty' ? [] : lines
  const subtotal = shown.reduce((s, l) => s + l.game.price * l.qty, 0)
  const save = shown.reduce((s, l) => s + (l.game.list - l.game.price) * l.qty, 0)
  const auto = useAutoClick(props.autorun)
  const cartEmpty = shown.length === 0
  useEffect(() => {
    if (props.waitForAutorun && !props.autorun) return
    if (cartEmpty) announce('Your cart is empty.')
  }, [cartEmpty, props.autorun, props.waitForAutorun])
  async function setQty(id: string, qty: number): Promise<void> {
    setLines((ls) => ls.map((l) => (l.game.id === id ? { ...l, qty } : l)))
    setBusyId(id)
    try {
      await request(props, true, true)
      announce(`Quantity ${qty}`)
    } catch {
      setLines((ls) => ls.map((l) => (l.game.id === id ? { ...l, qty: Math.max(1, qty - 1) } : l)))
    } finally {
      setBusyId(null)
    }
  }
  function remove(id: string): void {
    const line = lines.find((l) => l.game.id === id)
    if (!line) return
    setLines((ls) => ls.filter((l) => l.game.id !== id))
    setRemoved(line)
    announce(`Removed ${line.game.title} from your cart. Undo is below the list.`)
    // Focus follows the result: the line it was on is gone, so it moves to Undo.
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-scenario="cart"] [data-undo]')?.focus())
  }
  function undo(line: { game: Game; qty: number }): void {
    setLines((ls) => (ls.some((l) => l.game.id === line.game.id) ? ls : [...ls, line]))
    setRemoved(null)
    announce(`Restored ${line.game.title} to your cart`)
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-scenario="cart"] [data-line-title="${line.game.id}"]`)?.focus())
  }
  if (!shown.length) {
    return (
      <div data-scenario="cart">
        <EmptyState kind="first-use" title="Your cart is empty" action={<Button variant="secondary">Browse deals</Button>}>
          Keys you add stay here on this device.
        </EmptyState>
      </div>
    )
  }
  return (
    <div className="vc-row" data-scenario="cart" ref={auto} style={{ alignItems: 'flex-start', gap: 'var(--gap-group)' }}>
      <div className="vc-stack" style={{ flex: '2 1 22rem', minInlineSize: 0 }}>
        <StepIndicator current={1} />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {shown.map((l, i) => (
            <CartLine
              autorun={i === 0}
              key={l.game.id}
              game={l.game}
              qty={l.qty}
              busy={busyId === l.game.id}
              onQty={(n) => void setQty(l.game.id, n)}
              onRemove={() => remove(l.game.id)}
              message={
                'changedFrom' in l && l.changedFrom ? (
                  <InlineMessage tone="warning" title="Price changed">
                    From {money(l.changedFrom)} to {money(l.game.price)} since you added it. Keep it, or remove it.
                  </InlineMessage>
                ) : l.game.regionOk === false ? (
                  <InlineMessage tone="warning" title="US key" action={<Button variant="secondary" onClick={() => remove(l.game.id)}>Move to wishlist</Button>}>
                    It won't activate in Germany. Choose the EU edition, or keep it as a gift for someone in the US.
                  </InlineMessage>
                ) : undefined
              }
            />
          ))}
        </ul>
        {removed ? (
          <p className="vc-row vc-muted">
            Recently removed: {removed.game.title}
            <Button variant="secondary" data-undo onClick={() => undo(removed)}>
              Undo
            </Button>
          </p>
        ) : null}
      </div>
      <aside className="vc-readout vc-cut" style={{ flex: '1 1 16rem' }} aria-label="Summary">
        <SummaryList subtotal={subtotal} save={save} tax={0} busy={busyId !== null} />
        <Button variant="primary" size="large">
          Check out · {money(subtotal)}
        </Button>
        <p className="vc-muted">Codes usually arrive in about 1 min.</p>
      </aside>
    </div>
  )
}

/* Registry ---------------------------------------------------------------------------------------------------- */
export const SCENARIOS: readonly ScenarioEntry[] = [
  { id: 'search', title: 'S1 · Search for a game', summary: 'Type: the search waits 250 ms, aborts the previous request and answers in place.', watch: 'Fast: results appear with no spinner. Slow: the spinner replaces the search icon at 400 ms. Empty: “No results for …” with Search all games. Fail: the error keeps the query; Try again works. Offline: says you are not connected.' },
  { id: 'filter', title: 'S2 · Filter the catalogue', summary: 'Platform, price range and region filters; sort menu; chips with Clear filters.', watch: 'The old results stay, dimmed, while a refresh runs; the count is announced. Empty: the chips are echoed with Clear filters. Fail on the first load: the region error with Try again; fail on a later refresh: an inline error over the kept list.' },
  { id: 'price-history', title: 'S2b · Price history on the game page', summary: 'A region with its own skeleton, empty state and error, and the chart’s table view.', watch: 'The chart draws in once (none under reduced motion); arrow keys move between points; “Show as table” gives the same data.' },
  { id: 'add-to-cart', title: 'S3 · Add to cart', summary: 'The primary action on a game page, beside the wishlist toggle.', watch: 'Pending at once (“Adding…”), the success label for 1.5 s and the cart count; a repeat press is ignored. Fail: the error beside the button, the cart unchanged.' },
  { id: 'cart', title: 'S3b · The cart', summary: 'Quantity stepper, price-changed and region warnings on the line, remove with Undo, live summary.', watch: 'Remove: the line goes and a “Recently removed” row with Undo appears under the list (no toast: the result is on screen). Quantity: the line’s price dims while saving and rolls back on fail.' },
  { id: 'wishlist', title: 'S4 · Wishlist', summary: 'Optimistic toggles; removal with Undo.', watch: 'The heart changes at once. Fail: it rolls back and “Not saved. Try again” appears beside the heart (never a toast). Empty: “Nothing saved yet”.' },
  { id: 'alert', title: 'S5 · Price-drop alert', summary: 'Set a price below the current one; the alert switch saves itself.', watch: 'A price at or above $23.99 shows the field error on blur. Success: an inline message, not a toast. The switch rolls back on fail with “Not saved. Try again.”' },
  { id: 'battle-pass', title: 'S6 · Battle pass edition', summary: 'Tier cards as a radio group; the track charges with the chosen edition.', watch: 'Arrow keys change the edition and the track updates; the change is announced. Empty: the paid editions show Sold out and the add button says why.' },
  { id: 'checkout', title: 'S7 · Check out and pay', summary: 'Validation with an error summary, then pay with the bank’s wait and a decline kept inline.', watch: 'Pay with the sample email: the summary takes focus and links to the field. Fix it: “Paying…”, then “Waiting for your bank…” at 8 s, the button never changing width (the bank’s own check cannot be cancelled from the store; the 60 s budget ends it). Fail: declined inline above the button, fields kept.' },
  { id: 'delivery', title: 'S8–S9 · Receive and copy the code', summary: 'A job: reserved → issued → delivered, then the receipt’s decode (the signature).', watch: 'Past 10 s (very slow, stalled): the slow line about 5 minutes and email, with Cancel order and refund beside it. Delivered: the key resolves group by group (one fade under reduced motion), Copy code confirms in place. Fail: “Not issued” with the refund and Try again now.' },
  { id: 'sign-in', title: 'S10 · Sign in', summary: 'A dialog form; password or an emailed code; the interrupted save completes after.', watch: 'Focus starts in the dialog and returns to the opener. An empty password shows the error summary. Fail: the error beside the button, what was typed is kept.' },
  { id: 'library', title: 'S11 · Library and orders', summary: 'Tabs per platform and the orders table; first use when empty.', watch: 'Skeleton cards at 400 ms on slow; empty: “No games yet” and “No orders yet”; fail: the region error with Try again.' },
  { id: 'offline', title: 'S12 · Not connected while browsing', summary: 'Flip the network control: the global banner, queued cart edits, then “Connected again”.', watch: 'Offline: the warning banner; quantity changes queue and say so; Check out says why it is unavailable. Back online: the positive banner for 3 s and one announcement.' },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  search: SearchScenario,
  filter: FilterScenario,
  'price-history': PriceHistoryScenario,
  'add-to-cart': AddToCartScenario,
  cart: CartScenario,
  wishlist: WishlistScenario,
  alert: AlertScenario,
  'battle-pass': BattlePassScenario,
  checkout: CheckoutScenario,
  delivery: DeliveryScenario,
  'sign-in': SignInScenario,
  library: LibraryScenario,
  offline: OfflineScenario,
}
