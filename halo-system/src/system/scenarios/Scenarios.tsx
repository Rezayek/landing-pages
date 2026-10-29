/**
 * Scenarios: HALO's components put together into the flows the landing page will have, so the whole loading →
 * waiting → result story can be seen and tuned before the page exists. Each one is driven by the /system toolbar:
 *
 *   latency   fast | slow | very slow | stalled | fail   (latency.ts)
 *   outcome   results | empty                            what a successful request returns
 *   network   online | offline                           offline rejects at once, like a dropped connection
 *
 * They follow INTERACTION.md and CONTENT.md: the indicator waits 400 ms and stays 500 ms (usePending inside Region
 * and ActionButton), payment is known-slow (pending at once), results land in place, errors keep what was typed and
 * say what to do, the one toast is "Build saved" with Copy link, and every change is announced once. Each scenario
 * root carries `data-scenario="<id>"` so capture scripts find it. Everything here is a fictional design study: no
 * request leaves the page.
 */
import { useEffect, useId, useRef, useState, type ComponentType, type FormEvent, type JSX } from 'react'
import { ActionButton, EmptyState, ErrorState, InlineMessage, Region, Skeleton, announce, toast } from '../feedback'
import {
  BANDS,
  Button,
  DEFAULT_BUILD,
  ErrorSummary,
  FINISHES,
  Field,
  IconButton,
  OrderSheet,
  PriceSummary,
  ProductViewer,
  SIZES,
  SaveIcon,
  SegmentedChoice,
  SwatchPicker,
  deliveryOf,
  describe,
  euro,
  priceOf,
  type Build,
  type PriceState,
} from '../halo'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '../latency'

export type Outcome = 'results' | 'empty'
export type Network = 'online' | 'offline'

export interface ScenarioProps {
  latency: LatencyId
  outcome: Outcome
  network: Network
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
    super("You're not connected.")
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

/** What each request is, in the words its failure uses (CONTENT.md §Errors): the cause, then what was kept. */
const CAUSES: Readonly<Record<string, readonly [cause: string, kept: string]>> = {
  'the size check': ['The size guide did not answer.', 'Your measure is kept.'],
  'the reservation': ['The launch list did not answer.', 'Your name and email are kept.'],
  'the payment': ['The payment service did not answer.', 'Nothing was charged and your details are kept.'],
  'saving it': ['This build could not be saved on this device.', 'Your choices on screen are kept.'],
  'removing it': ['This build could not be removed from this device.', 'It is still in Saved builds.'],
  'loading the options': ['The sizes, cases and bands did not arrive.', 'Your choices on this device are kept.'],
}

/** CONTENT.md §Errors: what happened and what was kept. The button beside it says what to do. */
function failureText(error: unknown, what: string): string {
  const [cause, kept] = CAUSES[what] ?? ['That did not work.', 'Nothing was lost.']
  if (error instanceof OfflineError) return `You're not connected, so ${what} did not happen. ${kept}`
  if (error instanceof SimulatedFailure) return `${cause} ${kept}`
  return `This took more than 30 seconds and was stopped. ${kept}`
}

const sizeOptions = SIZES.map((s) => ({ id: s.id, label: s.label }))
const sizeNote = (id: string): string => `from ${euro(SIZES.find((s) => s.id === id)?.price ?? 0)}`

// ---------------------------------------------------------------------------------------------------------------
// 1. Choose your HALO: size, finish, band; the product settles in each build; price and delivery update in place;
//    the 360° view loads on intent; pre-order opens the sheet and the payment ends in every outcome
// ---------------------------------------------------------------------------------------------------------------
function ChooseScenario(props: ScenarioProps): JSX.Element {
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD)
  const [price, setPrice] = useState<PriceState>('ready')
  const [delivery, setDelivery] = useState(deliveryOf(DEFAULT_BUILD))
  const [open, setOpen] = useState(false)
  const [paid, setPaid] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [postcode, setPostcode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [slowPay, setSlowPay] = useState(false)
  const slowTimer = useRef<number | undefined>(undefined)
  const declineRef = useRef<HTMLDivElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const controller = useRef<AbortController | null>(null)
  const ids = { name: useId(), email: useId(), postcode: useId() }
  const soldOut = BANDS.find((b) => b.id === build.band)?.soldOutIn === build.size

  async function estimate(next: Build): Promise<void> {
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    setPrice('stale')
    try {
      const text = await request(props, deliveryOf(next), deliveryOf(next), own.signal)
      setDelivery(text)
      setPrice('ready')
      announce(`${euro(priceOf(next))}. ${text}`)
    } catch (error) {
      if (!isAbort(error)) setPrice('error')
    }
  }

  function change(patch: Partial<Build>): void {
    const next = { ...build, ...patch }
    setBuild(next)
    void estimate(next)
  }

  useEffect(() => () => controller.current?.abort(), [])

  const errors = [
    !fullName.trim() ? { id: ids.name, text: 'Enter your name' } : null,
    !email.trim() ? { id: ids.email, text: 'Enter your email address' } : !/^\S+@\S+\.\S+$/.test(email) ? { id: ids.email, text: 'Enter an email address like name@example.com' } : null,
    !postcode.trim() ? { id: ids.postcode, text: 'Enter a postcode' } : null,
  ].filter((e): e is { id: string; text: string } => !!e)
  const show = (id: string): string | null => (submitted ? errors.find((e) => e.id === id)?.text ?? null : null)

  return (
    <div className="h-scn h-scn--choose">
      <div data-stage="black" className="h-scn__stage">
        <ProductViewer
          build={build}
          width={170}
          loadFrames={async (signal, progress) => {
            if (props.network === 'offline') throw new OfflineError()
            for (let i = 1; i <= 4; i++) {
              await simulate(props.latency, true, signal)
              progress(i / 4)
              if (props.latency === 'fast') break
            }
            progress(1)
          }}
        />
      </div>
      <div className="h-scn__panel">
        <SegmentedChoice label="Case size" note={sizeNote(build.size)} options={sizeOptions} value={build.size} onChange={(id) => change({ size: id as Build['size'] })} />
        <SwatchPicker
          label="Case"
          shape="finish"
          options={FINISHES.map((f) => ({ id: f.id, label: f.label, hex: f.metal[1] }))}
          value={build.finish}
          onChange={(id) => change({ finish: id as Build['finish'] })}
        />
        <SwatchPicker
          label="Band"
          options={BANDS.map((b) => ({ id: b.id, label: b.label, hex: b.hex, unavailable: b.soldOutIn === build.size }))}
          value={build.band}
          onChange={(id) => change({ band: id as Build['band'] })}
        />
        <PriceSummary build={build} state={price} delivery={delivery} onRetry={() => void estimate(build)} />
        <div className="h-scn__action">
        <Button
          variant="primary"
          size="large"
          unavailable={soldOut ? 'Glacier blue in 41 mm ships from December. Choose 45 mm or another band.' : undefined}
          onClick={() => {
            setOpen(true)
            setPaid(null)
            setSubmitted(false)
            setDeclined(false)
            setFailure(null)
          }}
        >
          Pre-order HALO
        </Button>
        {soldOut ? null : <p className="h-btn__reason">Ships in November. A design study: nothing is charged.</p>}
        </div>
      </div>
      <OrderSheet
        open={open}
        onClose={() => setOpen(false)}
        title={paid ? 'Your HALO is reserved' : 'Pre-order HALO'}
        footer={
          paid ? (
            <Button variant="secondary" onClick={() => setOpen(false)}>Back to HALO</Button>
          ) : (
            <>
              <span className="h-demo-total">Total {euro(priceOf(build))}</span>
              <ActionButton
                variant="primary"
                knownSlow
                pendingLabel="Processing payment…"
                successLabel="Paid"
                slowLabel="Still processing…"
                slowMessage="Still with the payment service. Nothing is charged twice."
                errorMessage={(e) => (e instanceof Error && e.name === 'ValidationError' ? 'Fix the problems listed at the top.' : failureText(e, 'the payment'))}
                onAction={async (signal) => {
                  setSubmitted(true)
                  setFailure(null)
                  setDeclined(false)
                  const current = [
                    !fullName.trim() ? ids.name : null,
                    !/^\S+@\S+\.\S+$/.test(email) ? ids.email : null,
                    !postcode.trim() ? ids.postcode : null,
                  ].filter(Boolean)
                  if (current.length) {
                    requestAnimationFrame(() => summary.current?.focus())
                    throw Object.assign(new Error('invalid'), { name: 'ValidationError' })
                  }
                  // the empty outcome stands for a declined card: a validation-like answer from the payment service
                  window.clearTimeout(slowTimer.current)
                  slowTimer.current = window.setTimeout(() => setSlowPay(true), 8000)
                  try {
                    const ok = await request(props, true, false, signal)
                    if (!ok) {
                      setDeclined(true)
                      requestAnimationFrame(() => declineRef.current?.focus())
                      throw Object.assign(new Error('declined'), { name: 'ValidationError' })
                    }
                  } finally {
                    window.clearTimeout(slowTimer.current)
                    setSlowPay(false)
                  }
                }}
                onSuccess={() => setPaid(`HALO-${build.size}${build.band.slice(0, 2).toUpperCase()}-0427`)}
                onError={(e) => setFailure(e instanceof Error && e.name === 'ValidationError' ? null : failureText(e, 'the payment'))}
              >
                Pay {euro(priceOf(build))}
              </ActionButton>
            </>
          )
        }
      >
        {paid ? (
          <div className="h-scn__confirm">
            <p className="h-scn__ref">Reference {paid}</p>
            <p>{describe(build)}. {delivery}. We'll email you at {email} when it ships.</p>
            <p className="h-price__study">A design study: nothing was charged and nothing was sent.</p>
          </div>
        ) : (
          <form noValidate className="h-scn__form" onSubmit={(e) => e.preventDefault()}>
            {submitted && errors.length ? <ErrorSummary ref={summary} heading={`Fix ${errors.length === 1 ? 'this problem' : `${errors.length} problems`} to pay`} errors={errors} /> : null}
            <PriceSummary build={build} state={price} delivery={delivery} />
            <Field id={ids.name} label="Name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={show(ids.name)} />
            <Field id={ids.email} label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={show(ids.email)} />
            <Field id={ids.postcode} label="Postcode" autoComplete="postal-code" value={postcode} onChange={(e) => setPostcode(e.target.value)} error={show(ids.postcode)} />
            <div className="h-scn__msgslot" aria-live="off">
              {declined ? (
                <div ref={declineRef} tabIndex={-1}>
                  <InlineMessage tone="error" title="Your card was declined">
                    Nothing was charged. Pay again with another card.
                  </InlineMessage>
                </div>
              ) : failure ? (
                <InlineMessage tone="error" title="Payment did not finish">{failure}</InlineMessage>
              ) : slowPay ? (
                <InlineMessage tone="info" title="Still with the payment service">
                  Nothing is charged twice. You can keep waiting, or close the sheet and we'll email you the outcome.
                </InlineMessage>
              ) : null}
            </div>
          </form>
        )}
      </OrderSheet>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Find your size (the search scenario): first use, a recommendation, no match, a field error, failure, offline
// ---------------------------------------------------------------------------------------------------------------
function FindSizeScenario(props: ScenarioProps): JSX.Element {
  const [wrist, setWrist] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState<unknown>(null)
  const controller = useRef<AbortController | null>(null)
  const fieldId = useId()
  const mm = parseWrist(wrist)
  const fieldError = touched && wrist.trim() && (mm === null || mm < 120 || mm > 230) ? 'Enter a wrist size from 120 to 230 mm, or in cm like 16.5 cm' : null

  async function run(signal?: AbortSignal): Promise<void> {
    if (mm === null || mm < 120 || mm > 230) {
      setTouched(true)
      return
    }
    controller.current?.abort()
    const own = new AbortController()
    controller.current = own
    signal?.addEventListener('abort', () => own.abort(), { once: true })
    setBusy(true)
    setError(null)
    try {
      const fits = SIZES.filter((s) => mm >= s.wrist[0] && mm <= s.wrist[1]).map((s) => s.label)
      const found = await request(props, fits, [], own.signal)
      setResult(found)
      announce(found.length ? `${found.join(' or ')} fits a ${mm} mm wrist` : `No size fits a ${mm} mm wrist with the sport band`)
    } catch (failure) {
      if (!isAbort(failure)) setError(failure)
    } finally {
      if (controller.current === own) setBusy(false)
    }
  }

  useEffect(() => () => controller.current?.abort(), [])

  function onSubmit(event: FormEvent): void {
    event.preventDefault()
    void run()
  }

  return (
    <div className="h-scn">
      <form noValidate onSubmit={onSubmit}>
        <Field
          id={fieldId}
          label="Wrist size"
          hint="Measure where you wear it, for example 165 mm"
          unit="mm"
          inputMode="decimal"
          reserveMessage
          value={wrist}
          onChange={(e) => setWrist(e.target.value)}
          onBlur={() => setTouched(true)}
          error={fieldError}
          action={<Button type="submit" variant="secondary">Find my size</Button>}
        />
      </form>
      {error ? (
        <div className="h-scn__slot" style={{ ['--slot' as string]: '21rem' }}>
          <ErrorState title="Size check did not finish" onRetry={(signal) => run(signal)} focusOnMount={false} headingLevel={4}>
            {failureText(error, 'the size check')}
          </ErrorState>
        </div>
      ) : (
        <div className="h-scn__slot" style={{ ['--slot' as string]: '21rem' }}>
        <Region
          label="your size"
          busy={busy}
          hasContent={result !== null}
          minHeight="21rem"
          fallback={
            <div className="h-scn__skeleton h-scn__skeleton--card" aria-hidden="true">
              <Skeleton variant="rect" width="45%" height="1.2rem" />
              <Skeleton variant="rect" width="90%" height="0.9em" />
              <Skeleton variant="rect" width="70%" height="0.9em" />
              <Skeleton variant="rect" width="9rem" height="var(--control-h)" />
            </div>
          }
        >
          {result === null ? (
            <EmptyState kind="first-use" title="Find the size that fits" headingLevel={4}>
              Enter your wrist and we'll recommend 41 mm or 45 mm.
            </EmptyState>
          ) : result.length === 0 ? (
            <EmptyState
              kind="no-results"
              title="No size fits that wrist with the sport band"
              filters={[`${mm} mm`]}
              headingLevel={4}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setWrist('')
                    setResult(null)
                    setTouched(false)
                    requestAnimationFrame(() => document.getElementById(fieldId)?.focus())
                  }}
                >
                  Measure again
                </Button>
              }
            >
              Measure where you wear the watch, or <a href="#contact">ask us about the long band</a>.
            </EmptyState>
          ) : (
            <InlineMessage tone="success" title={`${result.join(' or ')} fits you`} action={<Button variant="secondary">Use {result[result.length - 1]}</Button>}>
              For a {mm} mm wrist. Between sizes, the larger case reads more easily on the run.
            </InlineMessage>
          )}
        </Region>
        </div>
      )}
    </div>
  )
}

function parseWrist(raw: string): number | null {
  const m = raw.trim().toLowerCase().replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(mm|cm|in)?$/)
  if (!m) return null
  const n = Number.parseFloat(m[1])
  const unit = m[2] ?? (n < 30 ? 'cm' : 'mm')
  return Math.round(unit === 'cm' ? n * 10 : unit === 'in' ? n * 25.4 : n)
}

// ---------------------------------------------------------------------------------------------------------------
// 3. Reserve with email (the sign-in scenario): validation on blur, the summary for 2+ errors, the result in place
// ---------------------------------------------------------------------------------------------------------------
function ReserveScenario(props: ScenarioProps): JSX.Element {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({})
  const [submitted, setSubmitted] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const ids = { name: useId(), email: useId() }
  const result = useRef<HTMLHeadingElement>(null)

  const errors = {
    name: !name.trim() ? 'Enter your name' : null,
    email: !email.trim() ? 'Enter your email address' : !/^\S+@\S+\.\S+$/.test(email) ? 'Enter an email address like name@example.com' : null,
  }
  const show = (f: 'name' | 'email'): string | null => (touched[f] || submitted ? errors[f] : null)
  const list = [errors.name ? { id: ids.name, text: errors.name } : null, errors.email ? { id: ids.email, text: errors.email } : null].filter(
    (e): e is { id: string; text: string } => !!e,
  )

  useEffect(() => {
    if (done) result.current?.focus()
  }, [done])

  if (done) {
    return (
      <div className="h-scn">
        <h4 ref={result} tabIndex={-1} className="h-scn__result">You're on the list, {done}</h4>
        <p className="h-demo-note">We'll write once, the day pre-orders open. No other email.</p>
        <Button variant="secondary" onClick={() => { setDone(null); setSubmitted(false); setTouched({}) }}>Reserve another</Button>
      </div>
    )
  }

  return (
    <form className="h-scn" noValidate onSubmit={(e) => e.preventDefault()}>
      <Field id={ids.name} reserveMessage label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} error={show('name')} />
      <Field id={ids.email} reserveMessage label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} error={show('email')} />
      <ActionButton
        type="submit"
        variant="primary"
        pendingLabel="Reserving…"
        successLabel="Reserved"
        slowLabel="Still reserving…"
        errorMessage={(e) => failureText(e, 'the reservation')}
        onAction={async (signal) => {
          setSubmitted(true)
          setFailure(null)
          if (list.length) {
            requestAnimationFrame(() => document.getElementById(list[0].id)?.focus())
            throw Object.assign(new Error('invalid'), { name: 'ValidationError' })
          }
          await request(props, true, true, signal)
        }}
        onDone={() => setDone(name.trim().split(' ')[0])}
        onError={(e) => setFailure(e instanceof Error && e.name === 'ValidationError' ? null : failureText(e, 'the reservation'))}
      >
        Reserve my place
      </ActionButton>
      {failure ? <InlineMessage tone="error" title="Not reserved yet">{failure}</InlineMessage> : null}
    </form>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 4. Save your build (optimistic): the mark flips at once; a failure rolls back with the reason beside it
// ---------------------------------------------------------------------------------------------------------------
const SAMPLE_BUILDS: readonly Build[] = [
  { size: '45', finish: 'natural', band: 'signal' },
  { size: '41', finish: 'black', band: 'graphite' },
  { size: '45', finish: 'black', band: 'lane' },
]

function SaveBuildScenario(props: ScenarioProps): JSX.Element {
  const [saved, setSaved] = useState<string[]>([])
  const [error, setError] = useState<{ key: string; text: string } | null>(null)
  const keyOf = (b: Build): string => `${b.size}-${b.finish}-${b.band}`

  function undo(build: Build): void {
    const key = keyOf(build)
    setSaved((all) => all.filter((k) => k !== key))
    announce(`${describe(build)} removed from Saved builds`)
  }

  async function toggle(build: Build): Promise<void> {
    const key = keyOf(build)
    const before = saved
    const removing = before.includes(key)
    setSaved(removing ? before.filter((k) => k !== key) : [...before, key])
    setError(null)
    try {
      await request(props, true, true)
      if (!removing) {
        toast('Build saved on this device.', {
          id: `saved-${key}`,
          tone: 'success',
          action: { label: 'Undo', onClick: () => void undo(build) },
          secondaryAction: { label: 'Copy link', onClick: () => announce('Link copied') },
        })
      }
    } catch (failure) {
      setSaved(before)
      setError({ key, text: failureText(failure, removing ? 'removing it' : 'saving it') })
      announce(`${describe(build)} was not ${removing ? 'removed' : 'saved'}`, 'assertive')
    }
  }

  return (
    <ul className="h-scn h-scn__list">
      {SAMPLE_BUILDS.map((b) => {
        const key = keyOf(b)
        const on = saved.includes(key)
        return (
          <li key={key} className="h-scn__item">
            <div className="h-scn__row">
              <span>{describe(b)}</span>
              <IconButton
                label={on ? `Saved. Remove ${describe(b)}` : `Save ${describe(b)}`}
                aria-pressed={on}
                variant="secondary"
                icon={<SaveIcon filled={on} />}
                onClick={() => void toggle(b)}
              />
            </div>
            <div className="h-scn__rowline">
              {error?.key === key ? (
                <>
                  <span className="h-scn__rowerror">
                    <span className="h-field__msgicon" aria-hidden="true">!</span>
                    Not saved. {error.text}
                  </span>
                  <Button variant="secondary" onClick={() => void toggle(b)}>Try again</Button>
                </>
              ) : (
                <span className="h-demo-note">{euro(priceOf(b))}</span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 5. Offline: the banner, a reservation waiting to send, sent when the network returns
// ---------------------------------------------------------------------------------------------------------------
function OfflineScenario(props: ScenarioProps): JSX.Element {
  const [queue, setQueue] = useState<{ email: string; state: 'waiting' | 'sending' | 'sent' }[]>([])
  const [email, setEmail] = useState('')
  const waiting = queue.filter((q) => q.state === 'waiting').length
  const flushing = useRef(false)

  useEffect(() => {
    if (props.network !== 'online' || waiting === 0 || flushing.current) return
    flushing.current = true
    const count = waiting
    setQueue((all) => all.map((q) => (q.state === 'waiting' ? { ...q, state: 'sending' } : q)))
    simulate(props.latency === 'fail' ? 'slow' : props.latency, true)
      .then(() => {
        setQueue((all) => all.map((q) => (q.state === 'sending' ? { ...q, state: 'sent' } : q)))
        announce(`${count} reservation${count === 1 ? '' : 's'} sent`)
      })
      .catch(() => setQueue((all) => all.map((q) => (q.state === 'sending' ? { ...q, state: 'waiting' } : q))))
      .finally(() => {
        flushing.current = false
      })
  }, [props.network, props.latency, waiting])

  return (
    <div className="h-scn">
      <div className="h-scn__banner">
        {props.network === 'offline' ? (
          <InlineMessage tone="info" title="You're not connected" announceText="You're not connected. You can still choose your HALO; a reservation sends when you're connected again.">
            You can still choose your HALO and read the specs. A reservation waits on this device and sends when you're connected again.
          </InlineMessage>
        ) : (
          <InlineMessage tone="success" title="You're connected">
            A reservation sends as soon as you press Reserve my place. If the connection drops, it waits on this device.
          </InlineMessage>
        )}
      </div>
      <form
        className="h-scn__row"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!/^\S+@\S+\.\S+$/.test(email)) return
          setQueue((all) => [...all, { email, state: props.network === 'offline' ? 'waiting' : 'sent' }])
          if (props.network === 'online') announce('Reservation sent')
          setEmail('')
        }}
      >
        <Field label="Email for launch day" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" variant="secondary">Reserve my place</Button>
      </form>
      <ul className="h-scn__list">
        {queue.map((q, i) => (
          <li key={i} className="h-scn__item">
            <span>{q.email}</span>
            <span className="h-demo-note">{q.state === 'sent' ? 'Sent' : q.state === 'sending' ? 'Sending…' : 'Waiting to send'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 6. Live stock and delivery: the estimate changes while the person reads; it updates in place and never moves
// ---------------------------------------------------------------------------------------------------------------
function LiveScenario(props: ScenarioProps): JSX.Element {
  const [delivery, setDelivery] = useState(deliveryOf(DEFAULT_BUILD))
  const [updated, setUpdated] = useState<string | undefined>(undefined)
  const [paused, setPaused] = useState(false)
  const tick = useRef(0)

  useEffect(() => {
    if (props.network === 'offline' || paused) return
    const timer = window.setInterval(() => {
      tick.current += 1
      const day = new Date(2026, 10, 3 + (tick.current % 3) * 2)
      const next = deliveryOf(DEFAULT_BUILD, day)
      setDelivery(next)
      setUpdated('Updated just now')
      announce(`Delivery estimate changed: ${next}`)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [props.network, paused])

  return (
    <div className="h-scn">
      <PriceSummary build={DEFAULT_BUILD} state={props.network === 'offline' ? 'error' : 'ready'} delivery={delivery} updated={updated} />
      <Button variant="secondary" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
        {paused ? 'Resume live updates' : 'Pause live updates'}
      </Button>
      <p className="h-demo-note">{props.network === 'offline' ? 'Paused while not connected: the last estimate stays.' : 'The estimate changes every few seconds; nothing on the page moves.'}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// 7. First look at the configurator: skeleton, the default build, a failed load with retry; saved builds empty
// ---------------------------------------------------------------------------------------------------------------
function FirstUseScenario(props: ScenarioProps): JSX.Element {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<unknown>(null)
  const [saved, setSaved] = useState<Build[] | null>(null)

  async function load(signal?: AbortSignal): Promise<void> {
    setState('loading')
    setError(null)
    try {
      const builds = await request(props, [] as Build[], [] as Build[], signal)
      setSaved(builds)
      setState('ready')
    } catch (failure) {
      if (isAbort(failure)) return
      setError(failure)
      setState('error')
    }
  }

  return (
    <div className="h-scn">
      {state === 'idle' ? <Button variant="secondary" onClick={() => void load()}>Open the configurator</Button> : null}
      {state === 'error' ? (
        <div className="h-scn__slot" style={{ ['--slot' as string]: '30rem' }}>
          <ErrorState title="The configurator did not load" onRetry={(signal) => load(signal)} focusOnMount={false} headingLevel={4}>
            {failureText(error, 'loading the options')}
          </ErrorState>
        </div>
      ) : state !== 'idle' ? (
        <div className="h-scn__slot" style={{ ['--slot' as string]: '30rem' }}>
        <Region
          label="the configurator"
          busy={state === 'loading'}
          hasContent={state === 'ready'}
          minHeight="30rem"
          fallback={
            <div className="h-scn" aria-hidden="true">
              <div className="h-price h-skel-lines">
                <span data-line="price"><Skeleton variant="rect" width="5ch" height="1.5rem" /></span>
                <span data-line="small"><Skeleton variant="rect" width="70%" height="0.8em" /></span>
                <span data-line="small"><Skeleton variant="rect" width="55%" height="0.8em" /></span>
                <span data-line="study"><Skeleton variant="rect" width="85%" height="0.8em" /></span>
              </div>
              <Skeleton variant="rect" width="100%" height="var(--saved-h)" />
            </div>
          }
        >
          <div className="h-scn" style={{ ['--fb-region-min' as string]: '0px' }}>
            <PriceSummary build={DEFAULT_BUILD} state="ready" delivery={deliveryOf(DEFAULT_BUILD)} />
            {saved && saved.length === 0 ? (
              <div className="h-scn__saved">
              <EmptyState kind="first-use" title="No saved builds yet" headingLevel={4} action={<Button variant="secondary">Save this build</Button>}>
                Save a build to compare it later. It stays on this device.
              </EmptyState>
              </div>
            ) : null}
          </div>
        </Region>
        </div>
      ) : null}
    </div>
  )
}

export const SCENARIOS: readonly ScenarioEntry[] = [
  {
    id: 'choose',
    title: 'Choose your HALO',
    summary: 'Size, case and band; the watch settles in each build; price and delivery update in place; pre-order and pay.',
    watch:
      'A change: the old frame waits under a 2 px bar, then the watch settles; the price goes muted until the estimate lands. Fail: the price stays, “Delivery estimate unavailable” with Try again. Glacier blue in 41 mm: Pre-order says why it is unavailable. Pay: pending at once (known slow); at 8 s “Still processing…” and a line that nothing is charged twice; empty = a declined card, said beside Pay with focus on it; fail = the cause beside Pay, fields kept.',
  },
  {
    id: 'find-size',
    title: 'Find your size',
    summary: 'The search scenario: a wrist measure in, a recommended case out.',
    watch: 'First use invites the measure. Fast: the answer only. Slow: a skeleton at 400 ms. 320 mm: the field error under the input, and nothing else moves. Empty: no-results naming the measure, with Measure again. Fail or not connected: the error replaces the region at the same height, with Try again.',
  },
  {
    id: 'reserve',
    title: 'Reserve with email',
    summary: 'The sign-in scenario: name and email, validated on blur, the button’s own states, the result in place.',
    watch: 'Two fields, so no summary (INTERACTION.md, Forms): submit empty and focus goes to the first invalid field, each field shows its own error. Fail: the cause under the button, nothing typed is lost. Success: “Reserved” with a light sweep, then the form becomes its result and its heading takes focus.',
  },
  {
    id: 'save-build',
    title: 'Save your build (optimistic)',
    summary: 'The bookmark fills at once; the server answers after.',
    watch: 'Any latency: it fills instantly; a toast “Build saved on this device.” carries Undo and Copy link (F8 reaches Undo first), and is the only place they live. Fail or not connected: it empties again and “Not saved” with Try again sits in that build’s own line (nothing below moves), announced once as an alert.',
  },
  {
    id: 'offline',
    title: 'Offline and reconnect',
    summary: 'The page keeps working offline; a reservation waits and sends when the network returns.',
    watch: 'Offline: the info banner says what still works; a reservation shows “Waiting to send”, never “Sent”. Back online: “Sending…”, then “Sent” and one announcement with the count.',
  },
  {
    id: 'live',
    title: 'Live stock and delivery',
    summary: 'The delivery estimate changes while the person reads.',
    watch: 'The value changes in place with “Updated just now”; nothing moves or shifts; one polite announcement per change; Pause stops it.',
  },
  {
    id: 'first-use',
    title: 'First look at the configurator',
    summary: 'The configurator loads its options; saved builds start empty.',
    watch: 'Slow: at 400 ms a skeleton built from the panel’s own shapes, in a region held at one height. Fail: the error state with Try again in the same space and height. Success: the default build and “No saved builds yet” with one action.',
  },
]

export const SCENARIO_DEMOS: Readonly<Record<string, ComponentType<ScenarioProps>>> = {
  choose: ChooseScenario,
  'find-size': FindSizeScenario,
  reserve: ReserveScenario,
  'save-build': SaveBuildScenario,
  offline: OfflineScenario,
  live: LiveScenario,
  'first-use': FirstUseScenario,
}
