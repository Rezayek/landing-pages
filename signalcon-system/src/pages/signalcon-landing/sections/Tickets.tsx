/**
 * S5 Tickets (CH04): pick a tier (and a day for 1-Day), pick how many, hold them for 10 minutes. A design study:
 * the hold is simulated with latency.ts (?latency=fast|slow|very-slow|stalled|fail) and nothing is charged or sent.
 */
import { type CSSProperties, type FormEvent, type JSX, useEffect, useRef, useState } from 'react'
import { ActionButton, announce, InlineMessage } from '@/system/feedback'
import { simulate, type LatencyId, SimulatedFailure } from '@/system/latency'
import {
  Button,
  Field,
  IconCheck,
  RadioCards,
  SectionHeader,
  Stepper,
  Sticker,
  StockGauge,
  Tape,
  TicketStub,
} from '@/system/ui'
import { DAYS, type DayId, euro, type Tier, type TierId, TIERS } from '../data'

export type Stock = Record<'three' | 'vip' | DayId, readonly [number, number]>

/** The hold time; ?hold=<seconds> shortens it so the ending states can be checked (a study sample hook). */
const HOLD_SECONDS = Number(new URLSearchParams(window.location.search).get('hold')) || 600

interface Held {
  summary: string
  days: string
  code: string
  expiresAt: number
}

class LowStock extends Error {
  readonly left: number
  constructor(left: number) {
    super('lowstock')
    this.left = left
  }
}

function passes(n: number): string {
  return `${n} ${n === 1 ? 'pass' : 'passes'}`
}

function validEmail(v: string): string | undefined {
  const s = v.trim()
  if (!s) return 'Enter your email address'
  if (!s.includes('@')) return 'Email address must include @, like name@example.com'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return 'Enter a full email address, like name@example.com'
  return undefined
}

export function Tickets({
  stock,
  feedPaused,
  updatedAt,
  latency,
}: {
  stock: Stock
  feedPaused: boolean
  updatedAt: string
  latency: LatencyId
}): JSX.Element {
  const [tier, setTier] = useState<TierId>('three')
  const [day, setDay] = useState<DayId>('fri')
  const [qty, setQty] = useState('2')
  const [qtyTouched, setQtyTouched] = useState(false)
  const [holdError, setHoldError] = useState<string | null>(null)
  const [held, setHeld] = useState<Held | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [emailDone, setEmailDone] = useState(false)
  const stubHeading = useRef<HTMLHeadingElement>(null)
  const holdButton = useRef<HTMLButtonElement>(null)
  const legendFocus = useRef(false)

  const n = Number.parseInt(qty, 10)
  const qtyValid = Number.isInteger(n) && n >= 1 && n <= 6 && String(n) === qty.trim()
  const qtyError = qtyTouched && !qtyValid ? 'Passes must be between 1 and 6' : undefined
  const chosen = TIERS.find((t) => t.id === tier) as Tier
  const total = qtyValid ? chosen.price * n : 0
  const stockFor = (id: TierId): readonly [number, number] => (id === 'day' ? stock[day] : stock[id])
  const tierName = tier === 'day' ? `1-Day ${DAYS.find((d) => d.id === day)?.short}` : chosen.name

  // the hold timer
  const secondsLeft = held ? Math.max(0, Math.round((held.expiresAt - now) / 1000)) : 0
  useEffect(() => {
    if (!held) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [held])
  useEffect(() => {
    if (!held) return
    if (secondsLeft === 60) announce('One minute left on your hold')
    if (secondsLeft === 0) announce('Your hold ended. The passes went back on sale.')
  }, [held, secondsLeft])
  useEffect(() => {
    if (held) stubHeading.current?.focus()
  }, [held])
  useEffect(() => {
    if (!held && legendFocus.current) {
      legendFocus.current = false
      document.querySelector<HTMLElement>('#tickets-sec .sc-legend')?.focus()
    }
  }, [held])

  const hold = async (signal: AbortSignal): Promise<void> => {
    setHoldError(null)
    const [left] = stockFor(tier)
    await simulate(latency, true, signal)
    if (left <= 0) throw new Error('soldout')
    if (qtyValid && left < n) throw new LowStock(left)
  }

  const submitEmail = async (signal: AbortSignal): Promise<void> => {
    const err = validEmail(email)
    setEmailError(err)
    if (err) throw new Error(err)
    await simulate(latency === 'fail' ? 'fast' : latency, true, signal)
    setEmailDone(true)
  }

  const tierCards = TIERS.map((t) => ({
    ...t,
    disabled: t.id !== 'day' && stock[t.id][0] <= 0,
    disabledReason: 'Sold out',
  }))

  return (
    <section className="pg-section pg-tickets" id="tickets-sec" data-wipe="" style={{ '--wipe-color': 'var(--paper-50)' } as CSSProperties} aria-labelledby="tickets">
      <div className="pg-wrap">
        <SectionHeader
          id="tickets"
          channel="CH04"
          title="Pick your"
          outlined="pass"
          sub="Prices include tax. Stock updates live (sample)."
          aside={
            <span className="pg-feed" data-paused={feedPaused || undefined}>
              {feedPaused ? `Live stock paused. Last update ${updatedAt}.` : `Live sample · updated ${updatedAt}`}
            </span>
          }
        />

        {held ? (
          <div className="pg-held">
            <TicketStub
              headingRef={stubHeading}
              summary={held.summary}
              days={held.days}
              code={held.code}
              secondsLeft={secondsLeft}
              totalSeconds={HOLD_SECONDS}
              note="Design study: checkout ends here. Nothing was charged or sent."
              onRelease={() => {
                legendFocus.current = true
                setHeld(null)
                announce('Hold released')
              }}
              onHoldAgain={() => {
                legendFocus.current = true
                setHeld(null)
              }}
            />
          </div>
        ) : (
          <form
            className="pg-order"
            onSubmit={(e: FormEvent) => e.preventDefault()}
            aria-describedby="pg-hold-note"
            noValidate
          >
            <RadioCards
              name="tier"
              legend="Choose a pass"
              items={tierCards}
              value={tier}
              onChange={(id) => setTier(id as TierId)}
              className="pg-tiers"
              render={(t, on) => {
                const [left, totalStock] = stockFor(t.id)
                return (
                  <>
                    {t.sticker && (
                      <span className="pg-tier-sticker">
                        <Sticker tone="acid" shape="burst" tilt={10} slam>
                          {t.sticker}
                        </Sticker>
                      </span>
                    )}
                    <span className="pg-tier-name">{t.name}</span>
                    <span className="pg-tier-price">
                      {euro(t.price)}
                      <span className="pg-tier-perday sc-mono">{t.perDay}</span>
                    </span>
                    <span className="pg-tier-line">{t.line}</span>
                    <ul className="pg-tier-includes">
                      {t.includes.map((inc) => (
                        <li key={inc}>
                          <IconCheck size={16} /> {inc}
                        </li>
                      ))}
                    </ul>
                    <span className="pg-tier-stock">
                      {t.id === 'day' && <span className="sc-mono">{DAYS.find((d) => d.id === day)?.short} · </span>}
                      <StockGauge left={left} total={totalStock} />
                    </span>
                    {on && <span className="sr-only">Selected</span>}
                  </>
                )
              }}
            />

            {tier === 'day' && (
              <div className="pg-day" data-slam="in">
                <RadioCards
                  name="day"
                  legend="Pick your day"
                  className="pg-days"
                  items={DAYS.map((d) => ({
                    ...d,
                    disabled: stock[d.id][0] <= 0,
                    disabledReason: 'Sold out',
                  }))}
                  value={day}
                  onChange={(id) => setDay(id as DayId)}
                  render={(d) => (
                    <>
                      <span className="pg-day-name">
                        {d.short} <span className="sc-mono">{d.date}.07</span>
                      </span>
                      <StockGauge left={stock[d.id][0]} total={stock[d.id][1]} compact />
                      {stock[d.id][0] <= 0 && (
                        <Tape tone="signal" tilt={-4} mono className="pg-day-soldout">
                          Sold out
                        </Tape>
                      )}
                    </>
                  )}
                />
                {stock.sat[0] <= 0 && (
                  <div className="pg-soldout-note">
                    <p>
                      <strong>Saturday 1-day passes are sold out.</strong> A 3-Day pass ({euro(89)}) still gets you in on
                      Saturday.
                    </p>
                    <Button variant="secondary" onClick={() => setTier('three')}>
                      Switch to 3-Day
                    </Button>
                    {emailDone ? (
                      <p className="pg-remind-done" role="status">
                        <IconCheck size={18} /> Noted. We'd email you if Saturday passes come back. Design study:
                        nothing was sent.
                      </p>
                    ) : (
                      <div className="pg-remind">
                        <Field
                          label="Tell me if Saturday passes come back"
                          value={email}
                          error={emailError}
                          onChange={(v) => {
                            setEmail(v)
                            if (emailError) setEmailError(validEmail(v))
                          }}
                        />
                        <ActionButton
                          variant="secondary"
                          onAction={submitEmail}
                          pendingLabel="Saving…"
                          successMessage="Noted. We'd email you if Saturday passes come back."
                          errorMessage={(e) => (e instanceof Error && e.message !== 'soldout' ? e.message : 'Could not save. Try again.')}
                        >
                          Email me if Saturday opens
                        </ActionButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pg-hold">
              <div className="pg-qty" onBlur={() => setQtyTouched(true)}>
                <Stepper label="How many passes" hint="Up to 6 per order" value={qty}
                  onChange={(v) => {
                    setQty(v)
                    // a typed number out of range is shown at once; an empty field waits for blur or submit
                    if (v.trim() !== '') setQtyTouched(true)
                  }}
                  error={qtyError}
                />
              </div>
              <div className="pg-hold-action">
                <ActionButton
                  ref={holdButton}
                  type="submit"
                  variant="primary"
                  onAction={hold}
                  disabled={!qtyValid}
                  disabledReason="Passes must be between 1 and 6"
                  onDisabledPress={() => setQtyTouched(true)}
                  pendingLabel="Holding your passes…"
                  slowLabel="Still holding. Stay here."
                  successMessage={false}
                  errorMessage={(e) =>
                    e instanceof LowStock
                      ? `Only ${e.left} ${tierName} passes left. Pick fewer, or switch to 3-Day.`
                      : e instanceof Error && e.message === 'soldout'
                      ? `${tierName} passes just sold out. 3-Day passes are still on sale.`
                      : e instanceof SimulatedFailure
                        ? "Couldn't hold your passes. Your picks are still here."
                        : "Couldn't hold your passes. Check your connection, then try again. Your picks are still here."
                  }
                  onError={(e) =>
                    setHoldError(
                      e instanceof LowStock
                        ? `Only ${e.left} ${tierName} passes left. Pick fewer, or switch to 3-Day.`
                        : e instanceof Error && e.message === 'soldout'
                        ? `${tierName} passes just sold out. 3-Day passes are still on sale.`
                        : "Couldn't hold your passes. Your picks are still here.",
                    )
                  }
                  onSuccess={() => {
                    const summary = `${n} × ${tierName} · ${euro(total)}`
                    const dayName = DAYS.find((d) => d.id === day)
                    const days = tier === 'day' ? `${dayName?.short} ${dayName?.date} Jul 2027` : 'Fri 23 – Sun 25 Jul 2027'
                    const code = `CH 04-${String(Math.floor(100 + Math.random() * 900))}`
                    announce(`Held: ${summary}. Design study: nothing was charged.`)
                    setNow(Date.now())
                    setHeld({ summary, days, code, expiresAt: Date.now() + HOLD_SECONDS * 1000 })
                  }}
                  successHoldMs={0}
                >
                  {qtyValid ? `Hold ${passes(n)} · ${euro(total)}` : 'Hold passes'}
                </ActionButton>
                <p id="pg-hold-note" className="pg-hold-note">
                  We hold them for 10 minutes while you check out. Design study: nothing is charged.
                </p>
              </div>
              {holdError && (
                <InlineMessage
                  tone="error"
                  action={
                    holdError.includes('sold out') || holdError.startsWith('Only') ? (
                      <Button variant="quiet" onClick={() => setTier('three')}>
                        Switch to 3-Day
                      </Button>
                    ) : (
                      <Button variant="quiet" onClick={() => holdButton.current?.click()}>
                        Try again
                      </Button>
                    )
                  }
                >
                  {holdError}
                </InlineMessage>
              )}
            </div>
          </form>
        )}
        <p className="pg-sample pg-tickets-sample">Stock is a live sample. Nothing here is for sale.</p>
      </div>
    </section>
  )
}
