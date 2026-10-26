/**
 * S8 Tastings (UX.md §S8, inventory A20-A25): the page's primary action. The booking sits in the lace well: the
 * date picker, the day's times (a Region with six slot skeletons, one time taken live, taken times kept marked when
 * the times reload), names and email, and the filled "Book a tasting". The booking card replaces the well in place
 * and takes focus. The quote is the quiet alternative: a text link opens it in place (also from any a[href="#quote"]
 * and from the #quote hash), focus to its first field; it has the error summary, per-file picture errors and the
 * offline queue. Behaviour follows BookingScenario and QuoteScenario in system/scenarios, with this page's copy.
 * Nothing is sent: a design study.
 */
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type JSX } from 'react'
import {
  ACTION_STOPPED,
  ActionButton,
  EmptyState,
  ErrorState,
  InlineMessage,
  Region,
  announce,
} from '@/system/feedback'
import { ChevronIcon } from '@/system/feedback/icons'
import {
  BookingCard,
  GUESTS,
  dayRule,
  normalisePostcode,
  slotsFor,
} from '@/system/cake'
import { SimulatedFailure, isAbort, simulate, type LatencyId } from '@/system/latency'
import {
  BeadBorder,
  Button,
  DatePicker,
  ErrorSummary,
  Field,
  FileInput,
  NumberStepper,
  TextInput,
  Textarea,
  TimeSlots,
  TimeSlotsSkeleton,
  describedBy,
  formatDate,
  type Slot,
  type UploadFile,
} from '@/system/ui'
import './tastings.css'

/** How long after a day's times arrive another couple books one of them (the live feed, UX.md A21). */
const LIVE_TAKE_MS = 12000

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

interface Problem {
  id: string
  text: string
}

/** Pictures the playground file input "picks": two refused, to show the per-file errors (UX.md A24). */
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

const subscribeOnline = (notify: () => void): (() => void) => {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}
const useOnline = (): boolean =>
  useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )

class OfflineError extends Error {
  constructor() {
    super('You are not connected.')
    this.name = 'OfflineError'
  }
}

/** CONTENT.md §Errors: the cause and the fix from the real state; the typed words are kept. */
function failureText(error: unknown): string {
  if (error instanceof OfflineError)
    return "You're not connected, so we could not reach the kitchen. Everything you wrote is still here. Check your connection, then try again."
  if (error instanceof SimulatedFailure) return "The kitchen's system did not answer. Everything you wrote is still here. Try again in a moment."
  return 'This took longer than it should. Everything you wrote is still here. Try again in a moment.'
}

function EmailUs(): JSX.Element {
  return (
    <>
      Or{' '}
      <a className="ms-link" href="mailto:hello@maisonsucre.example">
        email hello@maisonsucre.example
      </a>
    </>
  )
}

/** The tall still beside a result or the quote form (64rem and up only): the right column is the cake, not empty ground. */
function Still({ src, alt }: { src: string; alt: string }): JSX.Element {
  return (
    <figure className="ts__still">
      <img src={src} alt={alt} width={960} height={540} loading="lazy" decoding="async" />
      <figcaption className="ts__credit">Rendered study</figcaption>
    </figure>
  )
}

export function Tastings({ latency }: { latency: LatencyId }): JSX.Element {
  const online = useOnline()
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)

  // the times load once the section is near the view, not at page load
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setArmed(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // ---------------------------------------------------------------------------------------------- the booking
  const [date, setDate] = useState<Date | null>(() => nextOpenDay(plusDays(4)))
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState<unknown>(null)
  const [checked, setChecked] = useState('')
  const [time, setTime] = useState<string | null>(null)
  const [names, setNames] = useState('')
  const [email, setEmail] = useState('')
  const [problems, setProblems] = useState<Problem[]>([])
  const [focusKey, setFocusKey] = useState(0)
  const [bookError, setBookError] = useState<{ taken: boolean; text: string } | null>(null)
  const [booked, setBooked] = useState<{ date: Date; time: string } | null>(null)
  const controller = useRef<AbortController | null>(null)
  const book = useRef<HTMLButtonElement>(null)
  const timeRef = useRef(time)
  const slotsRef = useRef(slots)
  useEffect(() => {
    timeRef.current = time
    slotsRef.current = slots
  }, [time, slots])
  const namesId = useId()
  const emailId = useId()
  const dateId = useId()
  const timesId = useId()
  const noteId = useId()
  const problem = (id: string): string | undefined => problems.find((p) => p.id === id)?.text
  const clearProblem = (id: string): void => setProblems((all) => all.filter((p) => p.id !== id))

  // times other couples took while the page was open stay taken when the times reload (the server would say so)
  const takenTimes = useRef(new Set<string>())
  // ?outcome=taken (captures and /system checks, like ?latency=): the time you hold is taken by another couple as you
  // book, once, so the "taken at the last moment" path (UX.md A22) can be seen with the sample data
  const takeHeld = useRef(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('outcome') === 'taken')
  const livePlayed = useRef(new Set<string>())

  const loadSlots = useCallback(
    async (day: Date): Promise<void> => {
      controller.current?.abort()
      const own = new AbortController()
      controller.current = own
      setLoadingSlots(true)
      setSlotsError(null)
      try {
        const fresh = slotsFor(day).map((s) => (takenTimes.current.has(`${day.toDateString()}|${s.time}`) ? { ...s, taken: true } : s))
        const found = await simulate(latency, fresh, own.signal)
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
    [latency],
  )

  useEffect(() => {
    if (!armed || !date) return
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void loadSlots(date)
    })
    return () => {
      cancelled = true
      controller.current?.abort()
    }
  }, [armed, date, loadSlots])

  // Live: another couple books one time on the day on screen, once. It is never the time you chose ("we hold it
  // while you fill in your names"), the list never reorders, the label says "just taken" and it is announced.
  const ready = slots !== null
  useEffect(() => {
    if (!ready || !date) return
    const day = date.toDateString()
    if (livePlayed.current.has(day)) return
    const timer = window.setTimeout(() => {
      const all = slotsRef.current
      if (!all) return
      const free = all.map((s, i) => (!s.taken && s.time !== timeRef.current ? i : -1)).filter((i) => i >= 0)
      if (free.length < 2) return
      const pick = free[free.length - 1]
      livePlayed.current.add(day)
      takenTimes.current.add(`${day}|${all[pick].time}`)
      setSlots(all.map((s, i) => (i === pick ? { ...s, taken: true, takenLive: true } : s)))
      announce(`${all[pick].time} was just taken`)
    }, LIVE_TAKE_MS)
    return () => window.clearTimeout(timer)
  }, [ready, date])

  function validate(): Problem[] {
    const found: Problem[] = []
    if (!time) found.push({ id: timesId, text: 'Choose a time' })
    if (!names.trim()) found.push({ id: namesId, text: 'Enter your names' })
    if (!email.trim()) found.push({ id: emailId, text: 'Enter your email address' })
    else if (!/^\S+@\S+\.\S+$/.test(email)) found.push({ id: emailId, text: 'Email address must include @, like you@example.com' })
    return found
  }

  // a new day shows its own six skeletons, never the last day's times under this day's name
  function chooseDay(day: Date | null): void {
    setDate(day)
    setSlots(null)
    setTime(null)
    setSlotsError(null)
  }

  const nextFree = date ? nextOpenDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)) : null

  // ------------------------------------------------------------------------------------------------ the quote
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteFocus, setQuoteFocus] = useState(0)
  const quote = {
    names: useId(),
    email: useId(),
    date: useId(),
    postcode: useId(),
    guests: useId(),
    notes: useId(),
  }
  const [form, setForm] = useState({ names: '', email: '', date: null as Date | null, postcode: '', guests: 120, notes: '' })
  const [quoteProblems, setQuoteProblems] = useState<Problem[]>([])
  const [quoteFocusKey, setQuoteFocusKey] = useState(0)
  const [sendError, setSendError] = useState(false)
  const [queued, setQueued] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const picks = useRef(0)
  const sentTitle = useRef<HTMLHeadingElement>(null)
  const send = useRef<HTMLButtonElement>(null)
  const quoteError = (id: string): string | undefined => quoteProblems.find((p) => p.id === id)?.text
  const clearQuoteProblem = (id: string): void => setQuoteProblems((all) => all.filter((p) => p.id !== id))

  const openQuote = useCallback((): void => {
    setQuoteOpen(true)
    setQuoteFocus((n) => n + 1)
  }, [])

  // a link to #quote opens it: the hash on arrival, a changed hash, and a click on the link itself (the hash may
  // not change when it is already #quote)
  useEffect(() => {
    const fromHash = (): void => {
      if (window.location.hash === '#quote') openQuote()
    }
    const onClick = (event: MouseEvent): void => {
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('a[href="#quote"]')) openQuote()
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('hashchange', fromHash)
      document.removeEventListener('click', onClick)
    }
  }, [openQuote])

  // focus to the first field (or to the confirmation's title when the request was already sent)
  useEffect(() => {
    if (!quoteFocus) return
    if (sent) sentTitle.current?.focus()
    else document.getElementById(quote.names)?.focus()
  }, [quoteFocus, sent, quote.names])

  // the queued request sends itself once the network is back
  useEffect(() => {
    if (!queued || !online) return
    const own = new AbortController()
    simulate(latency, true, own.signal)
      .then(() => {
        setQueued(false)
        setSent('MS-Q-0412')
        announce('Sent. Your request is with us.')
      })
      .catch((e) => {
        if (!isAbort(e)) {
          setQueued(false)
          setSendError(true)
        }
      })
    return () => own.abort()
  }, [queued, online, latency])

  function validateQuote(): Problem[] {
    const found: Problem[] = []
    if (!form.names.trim()) found.push({ id: quote.names, text: 'Enter your names' })
    if (!form.email.trim()) found.push({ id: quote.email, text: 'Enter your email address' })
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) found.push({ id: quote.email, text: 'Email address must include @, like you@example.com' })
    if (!form.date) found.push({ id: quote.date, text: 'Enter your wedding date' })
    else if (form.date < TODAY) found.push({ id: quote.date, text: 'Enter a wedding date in the future, like 14 Jun 2027' })
    if (form.postcode.trim() && !normalisePostcode(form.postcode)) found.push({ id: quote.postcode, text: 'Postcode must be a full UK postcode, like SW4 0JH' })
    if (form.guests < GUESTS.min || form.guests > GUESTS.max)
      found.push({ id: quote.guests, text: `Guests must be between ${GUESTS.min} and ${GUESTS.max}. For more, ask us about a larger cake.` })
    return found
  }

  // ------------------------------------------------------------------------------------------------- render
  return (
    <section id="tastings" className="ts" aria-labelledby="tastings-title" ref={root}>
      <div className="ts__inner">
        <header className="ts__head">
          <h2 id="tastings-title" className="ms-focus-target" tabIndex={-1} ref={title}>
            Book a tasting
          </h2>
          <BeadBorder variant="shell" />
          <p className="ts__sub">Choose a day and a time. We hold it while you fill in your names.</p>
        </header>

        {booked ? (
          <div className="ts__done" data-scenario="booking">
            <BookingCard date={booked.date} time={booked.time} flavours={[]} reference="MS-2611" />
            <button
              type="button"
              className="ms-link ts__linkbtn"
              onClick={() => {
                setBooked(null)
                setBookError(null)
                title.current?.focus()
              }}
            >
              Change or cancel
            </button>
            <Still src="/maison-sucre-landing/stills/topper-960.webp" alt="The top tier of the four-tier cake: a crown of sugar roses and pressed gold leaf (rendered study)" />
          </div>
        ) : (
          <form className="ts__well ms-lace" noValidate aria-label="Book a tasting" onSubmit={(e) => e.preventDefault()}>
            <ErrorSummary id="booking-summary" errors={problems} focusKey={focusKey} />
            <div className="ts__cols">
              <div className="ts__cal">
                <DatePicker
                  id={dateId}
                  label="Tasting date"
                  hint="Weekdays except Monday, and Saturdays (sample)"
                  value={date}
                  onChange={chooseDay}
                  rule={(d) => dayRule(d, TODAY)}
                  inline
                  today={TODAY}
                />
              </div>

              <div className="ts__stack">
                {/* focus lands here from the error summary, then moves to the first time */}
                <div
                  id={timesId}
                  className="ts__times"
                  tabIndex={problem(timesId) ? -1 : undefined}
                  onFocus={(e) => {
                    if (e.target === e.currentTarget) e.currentTarget.querySelector<HTMLElement>('.ms-slot')?.focus()
                  }}
                >
                  {slotsError && !slots ? (
                    <ErrorState
                      title="We could not load the times for that day"
                      headingLevel={4}
                      focusOnMount={false}
                      onRetry={() => (date ? loadSlots(date) : undefined)}
                    >
                      {failureText(slotsError)} <EmailUs />
                    </ErrorState>
                  ) : (
                    <Region
                      label="tasting times"
                      busy={loadingSlots}
                      hasContent={slots !== null}
                      minHeight="10.5rem" /* the label, two rows of 44 px times and the freshness line: nothing moves when they arrive */
                      fallback={<TimeSlotsSkeleton legend={date ? `Times on ${formatDate(date, false)}` : 'Times'} />}
                    >
                      {slots && date && slots.every((s) => s.taken && !s.takenLive) ? (
                        <EmptyState
                          kind="no-results"
                          title={`No tastings on ${formatDate(date, false)}`}
                          headingLevel={4}
                          action={
                            nextFree ? (
                              <Button variant="secondary" onClick={() => chooseDay(nextFree)}>
                                See {formatDate(nextFree, false)}
                              </Button>
                            ) : undefined
                          }
                        >
                          The next free day is {nextFree ? formatDate(nextFree, false) : 'soon'}. (Sample.)
                        </EmptyState>
                      ) : slots && date ? (
                        <TimeSlots
                          legend={`Times on ${formatDate(date, false)}`}
                          slots={slots}
                          value={time}
                          onChange={(t) => {
                            setTime(t)
                            clearProblem(timesId)
                          }}
                          freshness={checked}
                          invalid={!!problem(timesId)}
                          describedBy={problem(timesId) ? `${timesId}-msg` : undefined}
                        />
                      ) : null}
                    </Region>
                  )}
                </div>
                {problem(timesId) ? (
                  <span className="ms-field__msg" data-tone="error" id={`${timesId}-msg`}>
                    <span className="ms-sr">Error: </span>
                    {problem(timesId)}
                  </span>
                ) : null}

                <Field id={namesId} label="Your names" message={problem(namesId)}>
                  <TextInput
                    id={namesId}
                    value={names}
                    autoComplete="name"
                    invalid={!!problem(namesId)}
                    aria-describedby={describedBy(namesId, false, !!problem(namesId))}
                    onChange={(e) => {
                      setNames(e.target.value)
                      clearProblem(namesId)
                    }}
                  />
                </Field>
                <Field id={emailId} label="Email address" message={problem(emailId)}>
                  <TextInput
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    value={email}
                    invalid={!!problem(emailId)}
                    aria-describedby={describedBy(emailId, false, !!problem(emailId))}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearProblem(emailId)
                    }}
                  />
                </Field>

                <div className="ts__act">
                  <ActionButton
                    ref={book}
                    type="submit"
                    variant="primary"
                    pendingLabel="Booking…"
                    successLabel="Booked"
                    successMessage={false}
                    aria-describedby={noteId}
                    errorMessage={(error) => {
                      const lost = error instanceof Error && error.message === 'taken'
                      return lost ? `${time ?? 'That time'} was booked a moment ago. Your details are kept. Choose another time.` : failureText(error)
                    }}
                    onAction={async (signal) => {
                      setBookError(null)
                      const found = validate()
                      setProblems(found)
                      if (found.length) {
                        setFocusKey((k) => k + 1)
                        return ACTION_STOPPED
                      }
                      if (!online) throw new OfflineError()
                      // a time taken at the last moment: the failure keeps the details and reloads the times
                      if (takeHeld.current && date && time) {
                        takeHeld.current = false
                        takenTimes.current.add(`${date.toDateString()}|${time}`)
                        await simulate(latency, true, signal)
                        throw new Error('taken')
                      }
                      if (slots?.find((s) => s.time === time)?.taken) throw new Error('taken')
                      await simulate(latency, true, signal)
                      setBooked({ date: date ?? TODAY, time: time ?? '' })
                    }}
                    onError={(error) => {
                      if (error instanceof Error && error.message === 'taken') {
                        setBookError({ taken: true, text: `${time} was booked a moment ago. Your details are kept. Choose another time.` })
                        setTime(null)
                        if (date) void loadSlots(date)
                      } else setBookError({ taken: false, text: failureText(error) })
                    }}
                  >
                    Book a tasting
                  </ActionButton>
                  <p id={noteId} className="ts__note">
                    Design study: nothing is sent and no one will call.
                  </p>
                </div>

                {bookError ? (
                  <InlineMessage
                    tone="error"
                    title="Your tasting is not booked yet"
                    action={
                      bookError.taken ? undefined : (
                        <Button variant="secondary" onClick={() => book.current?.click()}>
                          Try again
                        </Button>
                      )
                    }
                  >
                    {bookError.text} {bookError.taken ? null : <EmailUs />}
                  </InlineMessage>
                ) : null}

                <button
                  type="button"
                  className="ms-link ts__linkbtn"
                  aria-expanded={quoteOpen}
                  aria-controls="quote"
                  onClick={() => {
                    if (quoteOpen) setQuoteOpen(false)
                    else openQuote()
                  }}
                >
                  Ask for a quote instead
                  <span className="ts__chev" data-open={quoteOpen || undefined} aria-hidden="true">
                    <ChevronIcon />
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* the quote form: closed behind the link above; a link to #quote opens it */}
        <div id="quote" className="ts__quote">
          <div hidden={!quoteOpen} className="ts__qwrap">
            <Still src="/maison-sucre-landing/stills/flowers-960.webp" alt="Sugar roses cascading down the cake's middle tiers, close up (rendered study)" />
            {sent ? (
              <div className="ts__sent ms-lace">
                {/* focus lands on the result's own title, never on a line of its body */}
                <InlineMessage tone="success">
                  <h3 ref={sentTitle} tabIndex={-1} className="ms-focus-target ts__sent-title">
                    Your request is with us
                  </h3>
                  <p>We'll reply within two working days with a quote. (Sample.)</p>
                  <p>Reference {sent} (sample). We can't wait to hear about your day.</p>
                </InlineMessage>
              </div>
            ) : (
              <form
                className="ts__qform ms-lace"
                noValidate
                aria-labelledby="quote-title"
                onSubmit={(e) => e.preventDefault()}
              >
                <h3 id="quote-title" className="ms-display">
                  Ask for a quote
                </h3>
                {!online ? (
                  <InlineMessage
                    tone="warning"
                    title="You're not connected"
                    announceText="You're not connected. Your quote request will send when you're back online."
                  >
                    You can keep writing. Your quote request will send when you're back online.
                  </InlineMessage>
                ) : null}
                {queued ? (
                  <InlineMessage
                    tone="info"
                    title="Waiting to send"
                    action={
                      <Button variant="quiet" onClick={() => setQueued(false)}>
                        Discard
                      </Button>
                    }
                  >
                    We'll send your request as soon as you're back online.
                  </InlineMessage>
                ) : null}
                <ErrorSummary id="quote-summary" errors={quoteProblems} focusKey={quoteFocusKey} />
                <div className="ts__qgrid">
                  <Field id={quote.names} label="Your names" message={quoteError(quote.names)}>
                    <TextInput
                      id={quote.names}
                      autoComplete="name"
                      value={form.names}
                      invalid={!!quoteError(quote.names)}
                      aria-describedby={describedBy(quote.names, false, !!quoteError(quote.names))}
                      onChange={(e) => {
                        setForm({ ...form, names: e.target.value })
                        clearQuoteProblem(quote.names)
                      }}
                    />
                  </Field>
                  <Field id={quote.email} label="Email address" message={quoteError(quote.email)}>
                    <TextInput
                      id={quote.email}
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      invalid={!!quoteError(quote.email)}
                      aria-describedby={describedBy(quote.email, false, !!quoteError(quote.email))}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value })
                        clearQuoteProblem(quote.email)
                      }}
                    />
                  </Field>
                  <DatePicker
                    id={quote.date}
                    label="Wedding date"
                    value={form.date}
                    message={quoteError(quote.date)}
                    onChange={(d) => {
                      setForm({ ...form, date: d })
                      clearQuoteProblem(quote.date)
                    }}
                  />
                  <Field id={quote.postcode} label="Venue postcode" optional message={quoteError(quote.postcode)}>
                    <TextInput
                      id={quote.postcode}
                      autoComplete="postal-code"
                      value={form.postcode}
                      invalid={!!quoteError(quote.postcode)}
                      aria-describedby={describedBy(quote.postcode, false, !!quoteError(quote.postcode))}
                      onChange={(e) => {
                        setForm({ ...form, postcode: e.target.value })
                        clearQuoteProblem(quote.postcode)
                      }}
                    />
                  </Field>
                  <Field id={quote.guests} label="Guests" message={quoteError(quote.guests)}>
                    <NumberStepper
                      id={quote.guests}
                      value={form.guests}
                      min={1}
                      max={999}
                      unit="guests"
                      invalid={!!quoteError(quote.guests)}
                      describedBy={describedBy(quote.guests, false, !!quoteError(quote.guests))}
                      onChange={(g) => {
                        setForm({ ...form, guests: g })
                        clearQuoteProblem(quote.guests)
                      }}
                    />
                  </Field>
                </div>
                <Field id={quote.notes} label="Tell us about your day" optional>
                  <Textarea
                    id={quote.notes}
                    value={form.notes}
                    maxLength={1000}
                    countId={`${quote.notes}-count`}
                    aria-describedby={`${quote.notes}-count`}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Field>
                <FileInput
                  label="Pictures you love"
                  latency={latency}
                  pick={() => SAMPLE_PICTURES[picks.current++ % SAMPLE_PICTURES.length]}
                />
                <div className="ts__act">
                  <ActionButton
                    ref={send}
                    type="submit"
                    variant="secondary"
                    pendingLabel="Sending…"
                    successLabel="Sent"
                    successMessage={false}
                    errorMessage={() => 'Not sent. Your request is still here.'}
                    onAction={async (signal) => {
                      setSendError(false)
                      const found = validateQuote()
                      setQuoteProblems(found)
                      if (found.length) {
                        setQuoteFocusKey((k) => k + 1)
                        return ACTION_STOPPED
                      }
                      if (!online) {
                        setQueued(true)
                        announce("Waiting to send. We'll send your request as soon as you're back online.")
                        return ACTION_STOPPED
                      }
                      await simulate(latency, true, signal)
                      setSent('MS-Q-0412')
                    }}
                    onError={() => setSendError(true)}
                  >
                    {online ? 'Send my request' : 'Send when online'}
                  </ActionButton>
                </div>
                {sendError ? (
                  <InlineMessage
                    tone="error"
                    title="Not sent"
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => send.current?.click()}
                      >
                        Try again
                      </Button>
                    }
                  >
                    Your request is still here.
                  </InlineMessage>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
