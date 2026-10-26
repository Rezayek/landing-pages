/**
 * Scenarios: Maison Sucre's eight flows (SYSTEM.md §Project) built from the system's components, so the whole
 * loading → waiting → result story can be seen and tuned before any page exists. Each one is driven by the /system
 * toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * They follow INTERACTION.md (the action table) and CONTENT.md (the romantic voice). Every figure is a sample
 * (cake/data.ts). Of the six reference scenarios: search is the gallery filter and the FAQ, the optimistic save is
 * keeping a flavour, offline and sync is the quote, live updates are the tasting slots, first use is the tasting box
 * and the builder, and sign in is replaced by "Save my design" (the site has no accounts). Each scenario root
 * carries `data-scenario="<id>"`, which is how capture scripts find it.
 */
import { useCallback, useEffect, useId, useRef, useState, type ComponentType, type JSX } from 'react'
import { ACTION_STOPPED, ActionButton, EmptyState, ErrorState, InlineMessage, Region, announce } from '../feedback'
import { CopyIcon } from '../feedback/icons'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'
import {
  Accordion,
  Button,
  Checkbox,
  ChoiceChips,
  DatePicker,
  Dialog,
  ErrorSummary,
  Field,
  FileInput,
  NumberStepper,
  SearchField,
  Segmented,
  Select,
  TextInput,
  Textarea,
  TimeSlots,
  TimeSlotsSkeleton,
  describedBy,
  formatDate,
  type Slot,
  type UploadFile,
} from '../ui'
import {
  BookingCard,
  BOX_SIZE,
  CAKES,
  CakeCard,
  CakeCardSkeleton,
  CakeStand,
  DEFAULT_DESIGN,
  FAQ,
  FLAVOURS,
  FlavourCard,
  GUESTS,
  HEXAGON_MAX_TIERS,
  PriceRange,
  STYLES,
  ServingsTable,
  TastingBox,
  checkDelivery,
  dayRule,
  normalisePostcode,
  portionsFor,
  pounds,
  priceFor,
  slotsFor,
  tiersForGuests,
  type Cake,
  type Design,
  type Finish,
  type Flavour,
  type Flowers,
  type Shape,
  type Style,
} from '../cake'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
  /** Opened with `?latency=`: run the scenario's main action once on arrival in view and keep its state. */
  autorun?: boolean
}

/**
 * Runs `run` once, the first time the scenario's root is 30 % in view, when `enabled`. Returns the ref for the root.
 * This is how a capture at 300, 1200 and 3500 ms after arrival sees the wait, then the result or the failure.
 */
function useArrival(enabled: boolean | undefined, run: () => void): (el: HTMLElement | null) => void {
  const latest = useRef(run)
  latest.current = run
  const done = useRef(false)
  const observer = useRef<IntersectionObserver | null>(null)
  return useCallback(
    (el: HTMLElement | null) => {
      observer.current?.disconnect()
      if (!el || !enabled || done.current || typeof IntersectionObserver === 'undefined') return
      observer.current = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting) || done.current) return
          done.current = true
          observer.current?.disconnect()
          latest.current()
        },
        { threshold: 0.3 },
      )
      observer.current.observe(el)
    },
    [enabled],
  )
}

/** Clicks the first match inside `root` after `delay` ms (the scenario presses its own button on arrival). */
function press(root: HTMLElement | null, selector: string, delay = 0): void {
  window.setTimeout(() => root?.querySelector<HTMLElement>(selector)?.click(), delay)
}

/** useArrival with the root element handed to `run`. */
function useArrivalRoot(enabled: boolean | undefined, run: (root: HTMLElement) => void): (el: HTMLElement | null) => void {
  const root = useRef<HTMLElement | null>(null)
  const arrive = useArrival(enabled, () => {
    if (root.current) run(root.current)
  })
  return useCallback(
    (el: HTMLElement | null) => {
      root.current = el
      arrive(el)
    },
    [arrive],
  )
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
    super('You are not connected.')
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

/**
 * CONTENT.md §Errors, warmer (the person's pick, round 1): the body says the cause and the fix from the real state,
 * never repeats the heading, and says the visitor's words are kept only where they typed some.
 */
function failureText(error: unknown, typed = false): string {
  const kept = typed ? ' Everything you wrote is still here.' : ''
  if (error instanceof OfflineError) return `You're not connected, so we could not reach the kitchen.${kept} Check your connection, then try again.`
  if (error instanceof SimulatedFailure) return `The kitchen's system did not answer.${kept} Try again in a moment.`
  return `This took longer than it should.${kept} Try again in a moment.`
}

/** The contact route, a real link (CONTENT.md, support route). */
function EmailUs(): JSX.Element {
  return (
    // "Or" is bound to the link with a no-break space and stays outside it: the link starts at the verb
    <>
      Or <a className="ms-link" href="mailto:hello@maisonsucre.example">
        email hello@maisonsucre.example
      </a>
    </>
  )
}

/** A failure body with the contact link under it. */
function Failure({ error, typed }: { error: unknown; typed?: boolean }): JSX.Element {
  return (
    <>
      {failureText(error, typed)} <EmailUs />
    </>
  )
}

const TODAY = new Date()
const plusDays = (n: number): Date => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + n)
/** The first day from `from` that the tasting calendar opens. */
function nextOpenDay(from: Date): Date {
  for (let i = 0; i < 60; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    if (!dayRule(d, TODAY).unavailable) return d
  }
  return from
}

// ---------------------------------------------------------------------------------------------------------------
// 1. The gallery: filter by style and tiers; stale-while-pending; no results; a failed load; the details dialog
// ---------------------------------------------------------------------------------------------------------------
function GalleryScenario(props: ScenarioProps): JSX.Element {
  const [style, setStyle] = useState<Style | null>(null)
  const [tiers, setTiers] = useState<string>('any')
  const [cakes, setCakes] = useState<readonly Cake[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [open, setOpen] = useState<Cake | null>(null)
  // with ?latency= the first load waits for arrival, so a capture sees the skeleton, then the grid or the error
  const [armed, setArmed] = useState(!props.autorun)
  const arrive = useArrival(props.autorun, () => setArmed(true))
  const controller = useRef<AbortController | null>(null)

  const load = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      controller.current?.abort()
      const own = new AbortController()
      controller.current = own
      signal?.addEventListener('abort', () => own.abort(), { once: true })
      setBusy(true)
      // the error stays until the retry settles: its Try again button holds the pending state and keeps focus
      const retrying = signal !== undefined
      try {
        const match = CAKES.filter((c) => (!style || c.style === style) && (tiers === 'any' || c.tiers === Number(tiers)))
        const found = await request(props, match, [], own.signal)
        setError(null)
        setCakes(found)
        // a retry that worked replaces the error with the cakes: focus goes to the first of them, not the page
        if (retrying) requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-scenario="gallery"] .ms-cakegrid :is(a, button)')?.focus())
        const what = style ? `${STYLES.find((s) => s.value === style)?.label.toLowerCase()} cakes` : 'cakes'
        announce(found.length ? `${found.length} ${what}` : `No ${what} match`)
      } catch (failure) {
        if (!isAbort(failure)) setError(failure)
      } finally {
        if (controller.current === own) setBusy(false)
      }
    },
    [props, style, tiers],
  )

  useEffect(() => {
    if (!armed) return
    void load()
    return () => controller.current?.abort()
  }, [load, armed])

  const filters = [style ? STYLES.find((s) => s.value === style)?.label : null, tiers !== 'any' ? `${tiers} tiers` : null].filter(Boolean) as string[]
  const tierId = useId()
  return (
    <div className="sys-stack" data-scenario="gallery" ref={arrive}>
      <div className="sys-row-wrap" style={{ alignItems: 'end' }}>
        <ChoiceChips
          legend="Style"
          options={STYLES.map((s) => ({ value: s.value, label: s.label, petal: s.petal, count: CAKES.filter((c) => c.style === s.value).length }))}
          value={style}
          onChange={setStyle}
        />
        <Field id={tierId} label="Tiers">
          <Select id={tierId} value={tiers} onChange={(e) => setTiers(e.target.value)} style={{ inlineSize: 'auto' }}>
            <option value="any">Any</option>
            {[2, 3, 4, 5].map((t) => (
              <option key={t} value={t}>
                {t} tiers
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error && !cakes ? (
        <ErrorState title="We could not load the cakes just now" onRetry={(signal) => load(signal)} focusOnMount={!props.autorun}>
          <Failure error={error} />
        </ErrorState>
      ) : (
        <>
          {error && cakes ? (
            <InlineMessage tone="error" title="We could not refresh the cakes" announceText="We could not refresh the cakes." action={<Button variant="quiet" onClick={() => void load()}>Try again</Button>}>
              The cakes below are from before. {failureText(error)}
            </InlineMessage>
          ) : null}
          <Region
            label="cakes"
            busy={busy}
            hasContent={cakes !== null}
            minHeight="24rem"
            fallback={
              <div className="ms-cakegrid">
                {/* as many slots as the first grid holds, so the card does not grow when the cakes arrive */}
                {Array.from({ length: 6 }, (_, i) => STYLES[i % STYLES.length]).map((s, i) => (
                  <CakeCardSkeleton key={i} petal={s.petal} />
                ))}
              </div>
            }
          >
            {cakes && cakes.length === 0 ? (
              filters.length ? (
                <EmptyState
                  kind="no-results"
                  title={`No cakes match ${filters.map((f) => `"${f}"`).join(' and ')}`}
                  filters={filters}
                  headingLevel={4}
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStyle(null)
                        setTiers('any')
                      }}
                    >
                      Show all styles
                    </Button>
                  }
                >
                  {tiers !== 'any' ? 'Try another number of tiers, or see every style.' : 'See every style, or ask us about this one.'}
                </EmptyState>
              ) : (
                <EmptyState kind="first-use" title="The gallery is being restocked" headingLevel={4} secondary={<EmailUs />}>
                  New cakes appear here as we finish them. Ask us for pictures of a style you love.
                </EmptyState>
              )
            ) : cakes ? (
              <div className="ms-cakegrid">
                {cakes.slice(0, 6).map((cake) => (
                  <CakeCard key={cake.id} cake={cake} onOpen={setOpen} />
                ))}
              </div>
            ) : null}
          </Region>
        </>
      )}
      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name ?? ''}
        actions={
          <>
            <a className="ms-btn" data-variant="primary" href="#design" onClick={() => setOpen(null)}>
              Design one like this
            </a>
            <Button variant="quiet" onClick={() => setOpen(null)}>
              Close
            </Button>
          </>
        }
      >
        {open ? (
          <div className="sys-row-wrap" style={{ alignItems: 'start' }}>
            <div style={{ inlineSize: 'min(260px, 100%)' }}>
              <CakeStand design={{ ...DEFAULT_DESIGN, tiers: open.tiers, shape: open.shape, finish: open.finish, flowers: open.flowers }} live={false} />
            </div>
            <div className="sys-stack" style={{ flex: '1 1 260px' }}>
              <p>{open.note}</p>
              <p className="ms-figure">
                {open.tiers} tiers · about {portionsFor(open.tiers, open.shape)} portions · {open.shape} · {open.finish}
              </p>
              <p>
                From {pounds(priceFor({ ...DEFAULT_DESIGN, tiers: open.tiers, shape: open.shape, finish: open.finish, flowers: open.flowers }).low)} (sample price)
              </p>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Flavours and the tasting box: keep is optimistic; removal has Undo; the box's first use and cleared states
// ---------------------------------------------------------------------------------------------------------------
function FlavoursScenario(props: ScenarioProps): JSX.Element {
  const arriveFlavours = useArrivalRoot(props.autorun, (root) => press(root, '.ms-flavour .ms-iconbtn'))
  const [kept, setKept] = useState<Flavour[]>([])
  const [emptied, setEmptied] = useState(false)
  const onToggle = async (flavour: Flavour, keep: boolean): Promise<void> => {
    await request(props, true, true)
    setKept((all) => (keep ? (all.some((f) => f.id === flavour.id) ? all : [...all, flavour]) : all.filter((f) => f.id !== flavour.id)))
  }
  return (
    <div className="sys-stack" data-scenario="flavours" ref={arriveFlavours}>
      <TastingBox
        kept={kept}
        cleared={emptied && kept.length === 0}
        onRemove={(f) =>
          setKept((all) => {
            const next = all.filter((x) => x.id !== f.id)
            if (!next.length) setEmptied(true)
            return next
          })
        }
        onRestore={(f, index) =>
          setKept((all) => {
            if (all.some((x) => x.id === f.id)) return all
            const next = [...all]
            next.splice(Math.min(index, next.length), 0, f)
            announce(`${f.name} put back`)
            return next
          })
        }
      />
      <div className="sys-stack">
        {FLAVOURS.slice(0, 4).map((f) => (
          <FlavourCard key={f.id} flavour={f} kept={kept.some((k) => k.id === f.id)} boxFull={kept.length >= BOX_SIZE} onToggle={onToggle} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Tiers and servings: the guest count marks the cake that serves them
// ---------------------------------------------------------------------------------------------------------------
function ServingsScenario(props: ScenarioProps): JSX.Element {
  const [guests, setGuests] = useState<number | null>(null)
  const arriveServings = useArrivalRoot(props.autorun, () => setGuests(120))
  return (
    <div data-scenario="servings" ref={arriveServings}>
      <ServingsTable guests={guests} onGuests={setGuests} />
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 4. The builder: the pinned stand, tiers set down, the live price range, flavour per tier, "Save my design"
// ---------------------------------------------------------------------------------------------------------------
const SHAPES: { value: Shape; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'square', label: 'Square' },
  { value: 'hexagon', label: 'Hexagon' },
]
const FINISHES: { value: Finish; label: string }[] = [
  { value: 'fondant', label: 'Fondant' },
  { value: 'buttercream', label: 'Buttercream' },
  { value: 'semi-naked', label: 'Semi-naked' },
  { value: 'naked', label: 'Naked' },
]
const FLOWER_OPTIONS: { value: Flowers; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'spray', label: 'A single spray' },
  { value: 'cascade', label: 'Cascade' },
  { value: 'crown', label: 'Crown' },
]

function BuilderScenario(props: ScenarioProps): JSX.Element {
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN)
  const [guests, setGuests] = useState<number | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [touched, setTouched] = useState(false)
  const guestsId = useId()
  const tiersId = useId()
  const set = (patch: Partial<Design>): void => {
    setTouched(true)
    setLink(null)
    setDesign((d) => {
      const next = { ...d, ...patch }
      if (next.shape === 'hexagon' && next.tiers > HEXAGON_MAX_TIERS) next.tiers = HEXAGON_MAX_TIERS
      const flavours = Array.from({ length: next.tiers }, (_, i) => next.flavours[i] ?? next.flavours[next.flavours.length - 1] ?? FLAVOURS[0].id)
      return { ...next, flavours }
    })
  }
  // on arrival: a three-tier cascade is set down (stack, count, the gold price edge), then Save my design is pressed
  const arriveBuilder = useArrivalRoot(props.autorun, (root) => {
    set({ tiers: 3, flowers: 'cascade' })
    press(root, '.fb-btn', 700)
  })
  const range = priceFor(design)
  const complete = design.tiers >= 3 && design.flowers !== 'none'
  return (
    <div className="sys-builder" data-scenario="builder" ref={arriveBuilder}>
      <div className="sys-stack">
        {!touched && guests === null ? (
          <EmptyState kind="first-use" title="Start with your guests" headingLevel={4}>
            Tell us how many, and we'll suggest the tiers.
          </EmptyState>
        ) : null}
        <Field id={guestsId} label="Guests" hint="We'll suggest the tiers (sample guide).">
          <NumberStepper
            id={guestsId}
            value={guests ?? 80}
            min={GUESTS.min}
            max={GUESTS.max}
            unit="guests"
            maxReason="400 guests is our largest. Ask us for more."
            describedBy={describedBy(guestsId, true, false)}
            onChange={(g) => {
              setGuests(g)
              const t = tiersForGuests(g, design.shape)
              if (t) set({ tiers: t })
            }}
          />
        </Field>
        <Field id={tiersId} label="Tiers">
          <NumberStepper
            id={tiersId}
            value={design.tiers}
            min={1}
            max={design.shape === 'hexagon' ? HEXAGON_MAX_TIERS : 5}
            unit="tiers"
            maxReason={design.shape === 'hexagon' ? 'Hexagon cakes go up to four tiers (sample rule)' : 'Five tiers is our tallest cake'}
            minReason="One tier is the smallest"
            onChange={(t) => set({ tiers: t })}
          />
        </Field>
        <Segmented
          legend="Shape"
          options={SHAPES.map((s) => ({ ...s, disabledReason: s.value === 'hexagon' && design.tiers > HEXAGON_MAX_TIERS ? 'Hexagon cakes go up to four tiers (sample rule)' : undefined }))}
          value={design.shape}
          onChange={(shape) => set({ shape })}
        />
        <Segmented legend="Finish" options={FINISHES} value={design.finish} onChange={(finish) => set({ finish })} />
        <ChoiceChips
          legend="Sugar flowers"
          options={FLOWER_OPTIONS.map((f) => ({ ...f, petal: f.value === 'none' ? undefined : ('floral' as const) }))}
          value={design.flowers}
          onChange={(v) => set({ flowers: v ?? 'none' })}
        />
        <Checkbox label="Pressed gold leaf (sample £45)" checked={design.goldLeaf} onChange={(e) => set({ goldLeaf: e.target.checked })} />
        <fieldset className="sys-stack" style={{ border: 0, padding: 0, margin: 0, minInlineSize: 0 }}>
          <legend className="ms-field__label">Flavour per tier, top to bottom</legend>
          {design.flavours.map((fid, i) => (
            <label key={i} className="sys-row-wrap" style={{ alignItems: 'center', minInlineSize: 0 }}>
              <span className="ms-figure" style={{ minInlineSize: '6ch' }}>
                Tier {i + 1}
              </span>
              <Select
                value={fid}
                onChange={(e) => set({ flavours: design.flavours.map((x, k) => (k === i ? e.target.value : x)) })}
                style={{ inlineSize: 'auto', flex: '1 1 12rem' }}
              >
                {FLAVOURS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </label>
          ))}
        </fieldset>
        <div className="sys-row-wrap" style={{ alignItems: 'center' }}>
          <ActionButton
            variant="primary"
            pendingLabel="Saving…"
            successLabel="Saved"
            successMessage="Design saved"
            onAction={async (signal) => {
              setSaveError(null)
              await request(props, true, true, signal)
              setLink(`maisonsucre.example/d/${(design.tiers * 977 + design.flavours.length * 31).toString(36).toUpperCase()}`)
            }}
            onError={(e) => setSaveError(failureText(e))}
          >
            Save my design
          </ActionButton>
          <Button
            variant="quiet"
            onClick={() => {
              set(DEFAULT_DESIGN)
              announce('Started again. Undo to bring your design back.')
            }}
          >
            Start again
          </Button>
        </div>
        {link ? (
          <InlineMessage
            tone="success"
            title="Your design"
            action={
              <Button
                variant="quiet"
                icon={<CopyIcon />}
                onClick={() => {
                  void navigator.clipboard?.writeText(`https://${link}`).catch(() => {})
                  setCopied(true)
                  announce('Link copied')
                  window.setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? 'Link copied' : 'Copy link'}
              </Button>
            }
          >
            {link} (sample)
          </InlineMessage>
        ) : null}
        {saveError ? (
          <InlineMessage tone="error" title="Your design is not saved yet">
            {saveError} <EmailUs />
          </InlineMessage>
        ) : null}
      </div>
      <div className="ms-stand-pin">
        <CakeStand design={design} variant="builder" failLive={props.network === 'offline'} />
        <PriceRange range={range} tiers={design.tiers} complete={complete} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Tasting booking: a day's slots load (Region), one is taken live, book with details, the booking card
// ---------------------------------------------------------------------------------------------------------------
function BookingScenario(props: ScenarioProps): JSX.Element {
  const [date, setDate] = useState<Date | null>(() => nextOpenDay(plusDays(4)))
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<unknown>(null)
  const [time, setTime] = useState<string | null>(null)
  const [names, setNames] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [bookError, setBookError] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ date: Date; time: string } | null>(null)
  const [checked, setChecked] = useState<string>('')
  const controller = useRef<AbortController | null>(null)
  // with ?latency= the times load on arrival, then the scenario books the first free time with sample details
  const [armed, setArmed] = useState(!props.autorun)
  const bookRoot = useRef<HTMLElement | null>(null)
  const attempted = useRef(false)
  const arriveBooking = useArrivalRoot(props.autorun, (root) => {
    bookRoot.current = root
    setArmed(true)
  })
  const namesId = useId()
  const emailId = useId()
  const dateId = useId()

  // times other couples took while the page was open stay taken when the times reload (the server would say so)
  const takenElsewhere = useRef(new Set<string>())
  const loadSlots = useCallback(
    async (day: Date | null, signal?: AbortSignal): Promise<void> => {
      if (!day) return
      controller.current?.abort()
      const own = new AbortController()
      controller.current = own
      signal?.addEventListener('abort', () => own.abort(), { once: true })
      setLoadingSlots(true)
      setSlotsError(null)
      try {
        const fresh = slotsFor(day).map((s) => (takenElsewhere.current.has(`${day.toDateString()}|${s.time}`) ? { ...s, taken: true } : s))
        const found = await request(props, fresh, fresh.map((s) => ({ ...s, taken: true })), own.signal)
        setSlots(found)
        setChecked('Times checked just now')
        const open = found.filter((s) => !s.taken).length
        announce(open ? `${open} times on ${formatDate(day, false)}` : `No tastings on ${formatDate(day, false)}`)
      } catch (failure) {
        if (!isAbort(failure)) setSlotsError(failure)
      } finally {
        if (controller.current === own) setLoadingSlots(false)
      }
    },
    [props],
  )

  useEffect(() => {
    if (!armed) return
    setTime(null)
    void loadSlots(date)
    return () => controller.current?.abort()
  }, [date, loadSlots, armed])

  useEffect(() => {
    if (!props.autorun || !slots || attempted.current) return
    attempted.current = true
    const free = slots.find((s) => !s.taken)
    if (!free) return
    setTime(free.time)
    setNames('Ana and Sam')
    setEmail('ana.and.sam@example.com')
    press(bookRoot.current, '.fb-btn[data-variant="primary"]', 400)
  }, [slots, props.autorun])

  // Live: another couple books a slot while the slots are on screen (every 9 s here; polled every 20 s in a page).
  useEffect(() => {
    if (!slots || props.network === 'offline') return
    const timer = window.setInterval(() => {
      setSlots((all) => {
        if (!all) return all
        const free = all.map((s, i) => (!s.taken ? i : -1)).filter((i) => i >= 0)
        if (free.length <= 1) return all
        const pick = free[free.length - 1]
        const next = all.map((s, i) => (i === pick ? { ...s, taken: true, takenLive: true } : s))
        if (date) takenElsewhere.current.add(`${date.toDateString()}|${all[pick].time}`)
        announce(`${all[pick].time} was just taken`)
        return next
      })
    }, 9000)
    return () => window.clearInterval(timer)
  }, [slots, props.network, date])

  function validate(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!time) e.time = 'Choose a time'
    if (!names.trim()) e[namesId] = 'Enter your names'
    if (!email.trim()) e[emailId] = 'Enter your email address'
    else if (!/^\S+@\S+\.\S+$/.test(email)) e[emailId] = 'Email address must include @, like you@example.com'
    return e
  }

  if (booked) {
    return (
      <div className="sys-stack" data-scenario="booking">
        <BookingCard date={booked.date} time={booked.time} flavours={['Lemon and elderflower', 'Pistachio and rose']} reference="MS-2611" />
        <Button variant="quiet" onClick={() => setBooked(null)}>
          Book another tasting (playground only)
        </Button>
      </div>
    )
  }

  const today = TODAY
  return (
    <div className="sys-builder sys-booking" data-scenario="booking" ref={arriveBooking}>
      <div className="sys-stack">
        <DatePicker
          id={dateId}
          label="Tasting date"
          hint="Weekdays except Monday, and Saturdays (sample)"
          value={date}
          onChange={setDate}
          rule={(d) => dayRule(d, today)}
          inline
          today={today}
        />
      </div>
      <div className="sys-stack">
        {slotsError && !slots ? (
          <ErrorState title="We could not load the tasting times just now" onRetry={(signal) => loadSlots(date, signal)} focusOnMount={false}>
            <Failure error={slotsError} />
          </ErrorState>
        ) : (
          <Region
            label="tasting times"
            busy={loadingSlots}
            hasContent={slots !== null}
            minHeight="10.5rem" /* the label, two rows of 44 px slots and the freshness line: nothing moves when they arrive */
            fallback={<TimeSlotsSkeleton legend={date ? `Times on ${formatDate(date, false)}` : 'Times'} />}
          >
            {slots && date && slots.every((s) => s.taken && !('takenLive' in s && s.takenLive)) ? (
              <EmptyState
                kind="no-results"
                title={`No tastings on ${formatDate(date, false)}`}
                headingLevel={4}
                action={
                  <Button variant="secondary" onClick={() => setDate(nextOpenDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)))}>
                    See {formatDate(nextOpenDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)), false)}
                  </Button>
                }
              >
                Every time that day is booked. The next free day is below. (Sample.)
              </EmptyState>
            ) : slots && date ? (
              <TimeSlots
                legend={`Times on ${formatDate(date, false)}`}
                slots={slots}
                value={time}
                onChange={setTime}
                freshness={checked}
                invalid={!!errors.time}
              />
            ) : null}
          </Region>
        )}
        {errors.time ? (
          <span className="ms-field__msg" data-tone="error" id="booking-time-msg">
            {errors.time}
          </span>
        ) : null}
        <Field id={namesId} label="Your names" message={errors[namesId]}>
          <TextInput id={namesId} value={names} autoComplete="name" invalid={!!errors[namesId]} aria-describedby={describedBy(namesId, false, !!errors[namesId])} onChange={(e) => setNames(e.target.value)} />
        </Field>
        <Field id={emailId} label="Email address" message={errors[emailId]}>
          <TextInput id={emailId} type="email" autoComplete="email" value={email} invalid={!!errors[emailId]} aria-describedby={describedBy(emailId, false, !!errors[emailId])} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <ActionButton
          variant="primary"
          pendingLabel="Booking…"
          successLabel="Booked"
          successMessage={false}
          onAction={async (signal) => {
            setBookError(null)
            const e = validate()
            setErrors(e)
            if (Object.keys(e).length) {
              const first = e.time ? null : document.getElementById(Object.keys(e)[0])
              ;(first ?? document.querySelector<HTMLElement>('[data-scenario="booking"] .ms-slot'))?.focus()
              return ACTION_STOPPED
            }
            if (props.network === 'offline') throw new OfflineError()
            // a slot taken at the last moment: the failure keeps the details and reloads the times
            const current = slots?.find((s) => s.time === time)
            if (current?.taken) throw new Error('taken')
            await simulate(props.latency, true, signal)
            setBooked({ date: date ?? TODAY, time: time ?? '' })
          }}
          onError={(error) => {
            if (error instanceof Error && error.message === 'taken') {
              setBookError(`${time} was booked a moment ago. Your details are kept. Choose another time.`)
              setTime(null)
              void loadSlots(date)
            } else setBookError(failureText(error, true))
          }}
        >
          {time ? `Book ${time}` : 'Book a tasting'}
        </ActionButton>
        {bookError ? (
          <InlineMessage tone="error" title="Your tasting is not booked yet">
            {bookError} <EmailUs />
          </InlineMessage>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 6. The quote request: error summary, field errors, pictures uploading, offline queue ("Send when online")
// ---------------------------------------------------------------------------------------------------------------
const SAMPLE_PICTURES: UploadFile[][] = [
  [
    { id: 'p1', name: 'peonies.jpg', sizeMb: 3.2 },
    { id: 'p2', name: 'IMG_2041.HEIC', sizeMb: 12.4 },
  ],
  [
    { id: 'p3', name: 'venue-table.png', sizeMb: 1.8 },
    { id: 'p4', name: 'notes.pdf', sizeMb: 0.3 },
  ],
  [{ id: 'p5', name: 'lace-dress.jpg', sizeMb: 2.6 }],
]

function QuoteScenario(props: ScenarioProps): JSX.Element {
  const ids = { names: useId(), email: useId(), date: useId(), postcode: useId(), guests: useId(), style: useId(), notes: useId() }
  const [form, setForm] = useState({ names: '', email: '', date: null as Date | null, postcode: '', guests: 120, style: '', notes: '', design: true })
  const [errors, setErrors] = useState<{ id: string; text: string }[]>([])
  const [focusKey, setFocusKey] = useState(0)
  const [sendError, setSendError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const picks = useRef(0)
  // on arrival: the couple's details are filled in and the request is sent (pending, then sent, not sent or queued)
  const arriveQuote = useArrivalRoot(props.autorun, (root) => {
    setForm((f) => ({ ...f, names: 'Ana and Sam', email: 'ana.and.sam@example.com', date: plusDays(240), postcode: 'SW4 0JH' }))
    press(root, '.fb-btn[data-variant="primary"]', 400)
  })
  const result = useRef<HTMLHeadingElement>(null)
  const err = (id: string): string | undefined => errors.find((e) => e.id === id)?.text

  useEffect(() => {
    if (sent) result.current?.focus()
  }, [sent])

  // the queued request sends itself once the network is back
  useEffect(() => {
    if (!queued || props.network !== 'online') return
    const controller = new AbortController()
    simulate(props.latency, true, controller.signal)
      .then(() => {
        setQueued(false)
        setSent('MS-Q-0412')
        announce('Sent. Your request is with us.')
      })
      .catch((e) => {
        if (!isAbort(e)) setSendError('Not sent. Your request is still here. Try again.')
      })
    return () => controller.abort()
  }, [queued, props.network, props.latency])

  function validate(): { id: string; text: string }[] {
    const e: { id: string; text: string }[] = []
    if (!form.names.trim()) e.push({ id: ids.names, text: 'Enter your names' })
    if (!form.email.trim()) e.push({ id: ids.email, text: 'Enter your email address' })
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.push({ id: ids.email, text: 'Email address must include @, like you@example.com' })
    if (!form.date) e.push({ id: ids.date, text: 'Enter your wedding date' })
    else if (form.date < TODAY) e.push({ id: ids.date, text: 'Enter a wedding date in the future, like 14 Jun 2027' })
    if (form.postcode.trim() && !normalisePostcode(form.postcode)) e.push({ id: ids.postcode, text: 'Postcode must be a full UK postcode, like SW4 0JH' })
    if (form.guests < GUESTS.min || form.guests > GUESTS.max) e.push({ id: ids.guests, text: `Guests must be between ${GUESTS.min} and ${GUESTS.max}. For more, ask us about a larger cake.` })
    return e
  }

  if (sent) {
    return (
      <div className="sys-stack" data-scenario="quote">
        {/* focus lands on the result's own title, never on a line of its body */}
        <InlineMessage tone="success">
          <h4 ref={result} tabIndex={-1} className="ms-focus-target" style={{ margin: 0 }}>
            Your request is with us
          </h4>
          <p style={{ margin: 0 }}>We'll reply within two working days with a quote. (Sample.)</p>
          <p style={{ margin: 0 }}>Reference {sent} (sample). We can't wait to hear about your day.</p>
        </InlineMessage>
        <Button variant="quiet" onClick={() => setSent(null)}>
          Write another request (playground only)
        </Button>
      </div>
    )
  }

  return (
    <form className="sys-stack ms-lace" data-scenario="quote" noValidate onSubmit={(e) => e.preventDefault()} ref={arriveQuote}>
      {props.network === 'offline' ? (
        <InlineMessage tone="warning" title="You're not connected" announceText="You're not connected. Your quote request will send when you're back online.">
          You can keep writing. Your quote request will send when you're back online.
        </InlineMessage>
      ) : null}
      {queued ? (
        <InlineMessage tone="info" title="Waiting to send" action={<Button variant="quiet" onClick={() => setQueued(false)}>Discard</Button>}>
          We'll send your request as soon as you're back online.
        </InlineMessage>
      ) : null}
      <ErrorSummary errors={errors} focusKey={focusKey} />
      <Field id={ids.names} label="Your names" message={err(ids.names)}>
        <TextInput id={ids.names} autoComplete="name" value={form.names} invalid={!!err(ids.names)} aria-describedby={describedBy(ids.names, false, !!err(ids.names))} onChange={(e) => setForm({ ...form, names: e.target.value })} />
      </Field>
      <Field id={ids.email} label="Email address" message={err(ids.email)}>
        <TextInput id={ids.email} type="email" autoComplete="email" value={form.email} invalid={!!err(ids.email)} aria-describedby={describedBy(ids.email, false, !!err(ids.email))} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <DatePicker
        id={ids.date}
        label="Wedding date"
        value={form.date}
        onChange={(d) => setForm({ ...form, date: d })}
        message={err(ids.date) ?? (form.date && form.date.getDay() === 1 ? 'We deliver Tuesday to Saturday. Monday weddings collect from the kitchen. (Sample.)' : undefined)}
        tone={err(ids.date) ? 'error' : 'warning'}
      />
      <Field id={ids.postcode} label="Venue postcode" optional message={err(ids.postcode)}>
        <TextInput id={ids.postcode} autoComplete="postal-code" value={form.postcode} invalid={!!err(ids.postcode)} aria-describedby={describedBy(ids.postcode, false, !!err(ids.postcode))} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
      </Field>
      <Field id={ids.guests} label="Guests" message={err(ids.guests)}>
        <NumberStepper id={ids.guests} value={form.guests} min={1} max={999} unit="guests" invalid={!!err(ids.guests)} describedBy={describedBy(ids.guests, false, !!err(ids.guests))} onChange={(g) => setForm({ ...form, guests: g })} />
      </Field>
      <Field id={ids.style} label="Style you love" optional>
        <Select id={ids.style} value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>
          <option value="">Not sure yet</option>
          {STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={ids.notes} label="Tell us about your day" optional>
        <Textarea id={ids.notes} value={form.notes} maxLength={1000} countId={`${ids.notes}-count`} aria-describedby={`${ids.notes}-count`} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
      <FileInput label="Pictures you love" latency={props.latency} pick={() => SAMPLE_PICTURES[picks.current++ % SAMPLE_PICTURES.length]} />
      <Checkbox label="Include my design from the builder" checked={form.design} onChange={(e) => setForm({ ...form, design: e.target.checked })} />
      <ActionButton
        type="submit"
        variant="primary"
        pendingLabel="Sending…"
        successLabel="Sent"
        successMessage={false}
        onAction={async (signal) => {
          setSendError(null)
          const e = validate()
          setErrors(e)
          if (e.length) {
            setFocusKey((k) => k + 1)
            document.title = `Error: ${document.title.replace(/^Error: /, '')}`
            return ACTION_STOPPED
          }
          document.title = document.title.replace(/^Error: /, '')
          if (props.network === 'offline') {
            setQueued(true)
            announce("Waiting to send. We'll send your request as soon as you're back online.")
            return
          }
          await simulate(props.latency, true, signal)
          setSent('MS-Q-0412')
        }}
        onError={(e) => setSendError(failureText(e, true))}
      >
        {props.network === 'offline' ? 'Send when online' : 'Ask for a quote'}
      </ActionButton>
      {sendError ? (
        <InlineMessage tone="error" title="Your request is not sent yet">
          {sendError} <EmailUs />
        </InlineMessage>
      ) : null}
    </form>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 7. Delivery check: postcode and date, checked on submit, a result beside the button
// ---------------------------------------------------------------------------------------------------------------
function DeliveryScenario(props: ScenarioProps): JSX.Element {
  const arriveDelivery = useArrivalRoot(props.autorun, (root) => press(root, '.fb-btn'))
  const postcodeId = useId()
  const dateId = useId()
  const [postcode, setPostcode] = useState('SW4 0JH')
  const [date, setDate] = useState<Date | null>(() => nextOpenDay(plusDays(200)))
  const [error, setError] = useState<{ postcode?: string; date?: string }>({})
  const [result, setResult] = useState<{ tone: 'success' | 'warning'; title: string; text: string } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <div className="sys-stack" data-scenario="delivery" ref={arriveDelivery}>
      <div className="sys-row-wrap" style={{ alignItems: 'start' }}>
        <div style={{ flex: '1 1 12rem' }}>
          <Field id={postcodeId} label="Venue postcode" message={error.postcode} tone={result?.tone === 'success' && !error.postcode ? 'success' : 'error'}>
            <TextInput id={postcodeId} value={postcode} invalid={!!error.postcode} aria-describedby={describedBy(postcodeId, false, !!error.postcode)} onChange={(e) => setPostcode(e.target.value)} />
          </Field>
        </div>
        <div style={{ flex: '1 1 14rem' }}>
          <DatePicker id={dateId} label="Wedding date" value={date} onChange={setDate} message={error.date} />
        </div>
      </div>
      <div className="sys-row-wrap" style={{ alignItems: 'center' }}>
        <ActionButton
          variant="secondary"
          pendingLabel="Checking…"
          successLabel="Checked"
          successMessage={false}
          onAction={async (signal) => {
            setFailed(null)
            setResult(null)
            const pc = normalisePostcode(postcode)
            const e = { postcode: pc ? undefined : postcode.trim() ? 'Postcode must be a full UK postcode, like SW4 0JH' : 'Enter your venue postcode', date: date ? undefined : 'Enter your wedding date' }
            setError(e)
            if (e.postcode || e.date || !pc || !date) {
              document.getElementById(e.postcode ? postcodeId : dateId)?.focus()
              return ACTION_STOPPED
            }
            const answer = await request(props, checkDelivery(pc, date), checkDelivery(pc, date), signal)
            const r =
              answer.kind === 'delivers'
                ? { tone: 'success' as const, title: 'We deliver there', text: `We deliver to ${answer.area} on ${formatDate(date)}. Delivery is included within 20 miles. (Sample.)` }
                : answer.kind === 'monday'
                  ? { tone: 'warning' as const, title: 'Not on a Monday', text: 'We deliver Tuesday to Saturday. Monday weddings collect from the kitchen. (Sample.)' }
                  : { tone: 'warning' as const, title: 'Outside our usual area', text: `${answer.area} is outside our usual area. Collect from the kitchen, or ask us. (Sample.)` }
            setResult(r)
            announce(r.text)
          }}
          onError={(e) => setFailed(failureText(e, true))}
        >
          Check delivery
        </ActionButton>
      </div>
      <div style={{ minBlockSize: '5rem' }}>
        {result ? (
          <InlineMessage tone={result.tone} title={result.title}>
            {result.text}
          </InlineMessage>
        ) : failed ? (
          <InlineMessage tone="error" title="We could not check delivery just now">
            {failed} <EmailUs />
          </InlineMessage>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 8. The FAQ: search as you type, answers highlighted, no answers with the query echoed
// ---------------------------------------------------------------------------------------------------------------
function FaqScenario(props: ScenarioProps): JSX.Element {
  const [query, setQuery] = useState('')
  const arriveFaq = useArrivalRoot(props.autorun, () => setQuery(props.outcome === 'empty' ? 'gluten-free vegan' : 'tasting'))
  const searchId = useId()
  const listId = useId()
  const q = query.trim().toLowerCase()
  const items = FAQ.filter((f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
  const said = useRef('')
  useEffect(() => {
    if (!q) return
    const text = items.length ? `${items.length} ${items.length === 1 ? 'answer' : 'answers'}` : `No answers match "${query}"`
    const t = window.setTimeout(() => {
      if (said.current !== text) announce(text)
      said.current = text
    }, 400)
    return () => window.clearTimeout(t)
  }, [q, items.length, query])
  return (
    <div className="sys-stack" data-scenario="faq" ref={arriveFaq}>
      <SearchField id={searchId} label="Search the questions" value={query} onChange={setQuery} controls={listId} count={q && items.length ? `${items.length} ${items.length === 1 ? 'answer' : 'answers'}` : undefined} />
      {items.length ? (
        <Accordion id={listId} query={query} items={items.map((f) => ({ id: f.id, question: f.question, answer: <p style={{ margin: 0 }}>{f.answer}</p> }))} />
      ) : (
        <EmptyState
          kind="no-results"
          title={`No answers match "${query}"`}
          headingLevel={4}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                document.getElementById(searchId)?.focus()
              }}
            >
              Clear search
            </Button>
          }
          secondary={
            <a className="ms-link" href="mailto:hello@maisonsucre.example">
              Ask us directly
            </a>
          }
        >
          Try another word, or ask us directly.
        </EmptyState>
      )}
    </div>
  )
}

export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'gallery',
    title: 'Browse cakes by style',
    summary: 'Style chips and a tier filter over the gallery; a cake opens its details. Sample cakes, rendered studies.',
    watch: 'Fast: the grid just changes. Slow: the grid stays, dims and a garnet bar runs along it at 400 ms. Empty: no-results with the chips echoed and Show all styles. Fail or offline on first load: the error replaces the grid with Try again; on a refresh the old grid stays under an inline error.',
  },
  {
    id: 'flavours',
    title: 'Keep flavours for the tasting',
    summary: 'The heart is optimistic; the box of six fills slot by slot; removing one offers Undo.',
    watch: 'Any latency: the heart fills at once with "Keeping…". Fail or offline: it empties and the card says "The tasting box did not answer, so this flavour is not kept", with one Try again. Remove: a toast with Undo for 10 s, the only toast on the site. Empty box: first use, then "Your box is empty again" after removing the last.',
  },
  {
    id: 'servings',
    title: 'Tiers and servings',
    summary: 'A guest count marks the smallest cake that serves them; the drawing shows the tiers to scale.',
    watch: 'Instant on purpose: no waiting at any latency, so the frames are the same at every preset. Before any count: the hint. A count: the row marked in garnet with "fits N", announced once you pause. Over 400: the field error and the larger-cake line.',
  },
  {
    id: 'builder',
    title: 'Design your cake',
    summary: 'Tiers, shape, finish, sugar flowers, gold leaf and a flavour per tier, on a pinned stand with a live sample price.',
    watch: 'Every change: the tier is set down on the stand and the price rolls to its new range (announced after a 1 s pause). The first complete design (3+ tiers with flowers) turns the bead edge of the price gold, still. Hexagon over four tiers says why it is unavailable. Save my design: pending, then Saved and the link in place; fail: Not saved beside it. Offline: the 3D cake falls back to its picture.',
  },
  {
    id: 'booking',
    title: 'Book a tasting',
    summary: 'A day loads its times; one is taken while you look; book with your names; the booking card.',
    watch: 'Slow: six slot skeletons at 400 ms. Empty: no tastings that day, with the next free day. Every 9 s a slot is "just taken" in place, announced, nothing moves. Book with a taken slot or on fail: Not booked beside the button, details kept, times reloaded. Success: the booking card replaces the form, takes focus, the gold fleck and a few falling petals once.',
  },
  {
    id: 'quote',
    title: 'Ask for a quote (and offline)',
    summary: 'Eight fields, pictures uploading with progress, an error summary, and a request that waits while offline.',
    watch: 'Submit empty: "There is a problem" takes focus, every field shows its error, the title starts "Error:". Pictures: progress with Cancel; a 12 MB HEIC and a PDF are refused per file. Offline: the banner, the button reads "Send when online", Send queues it ("Waiting to send"); back online it sends and the confirmation takes focus.',
  },
  {
    id: 'delivery',
    title: 'Check delivery',
    summary: 'Postcode and wedding date, checked on submit only; the answer beside the button.',
    watch: 'A London postcode: "We deliver there". Outside: the warning with collection. A Monday: the warning. A bad postcode: the field error on submit. Fail: Not checked, Try again.',
  },
  {
    id: 'faq',
    title: 'Questions',
    summary: 'Search as you type; matches highlighted in the questions; several answers can be open.',
    watch: 'Instant on purpose: the search runs in the page at every latency. Typing filters at once and the count is announced after a pause. Nothing matches: the query echoed, Clear search, and the way to ask directly.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  gallery: GalleryScenario,
  flavours: FlavoursScenario,
  servings: ServingsScenario,
  builder: BuilderScenario,
  booking: BookingScenario,
  quote: QuoteScenario,
  delivery: DeliveryScenario,
  faq: FaqScenario,
}
