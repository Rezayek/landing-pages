/**
 * S2 Today's deals (UX.md §S2; A4-A13): the region picker and platform filter over eight kiosks, the lead kiosk with
 * its 90-day price chart, and a price alert on every kiosk. Filters are client-side over bundled sample data, so
 * they answer at once (no indicator). The stalls light up as you reach them: the kiosks clip in from the top,
 * scrubbed by scroll, one column after another (MOTION.md S1 → S2); the heading's words assemble.
 */
import { useRef, useState, type JSX, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Button, Kiosk, PriceChart, Segmented, Select, TextInput } from '@/system/components'
import { ActionButton, EmptyState, announce } from '@/system/feedback'
import {
  DEALS,
  LEAD,
  LEAD_HISTORY,
  PLATFORM_NAME,
  PLATFORM_OPTIONS,
  REGION_IN_TEXT,
  REGION_LINE,
  REGION_OPTIONS,
  money,
  percentOff,
  worksIn,
  type Deal,
  type PlatformFilter,
  type VisitorRegion,
} from '../data'
import { alertStore, cartStore, sceneBus, simulated, useAlerts, useCart } from '../state'

/* Price alert (A10-A12) ------------------------------------------------------------------------------------------------ */
/** A typing problem: shown under the field, never as "Alert set". */
class InvalidPrice extends Error {}

function parsePrice(raw: string): number | null {
  const cleaned = raw.trim().replace(/^\$/, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Number(cleaned)
}

function validate(raw: string, today: number): string | null {
  if (!raw.trim()) return 'Enter a price for the alert'
  const value = parsePrice(raw)
  if (value === null) return 'Enter the price as a number, like 14.99'
  if (value <= 0) return 'Enter a price above $0'
  if (value >= today) return `Set the alert below today's price of ${money(today)}`
  return null
}

function PriceAlert({ deal }: { deal: Deal }): JSX.Element {
  const alerts = useAlerts()
  const set = alerts[deal.id]
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(() => (Math.floor(deal.price * 0.9 * 100) / 100).toFixed(2))
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const formId = `alert-${deal.id}`

  if (set !== undefined) {
    return (
      <p className="vl-alert__set">
        <span>Alert set below {money(set)}. Design study: no email is sent.</span>
        <Button
          variant="quiet"
          onClick={() => {
            alertStore.clear(deal.id)
            announce('Alert removed')
            window.requestAnimationFrame(() => document.getElementById(`${formId}-trigger`)?.focus())
          }}
        >
          Remove alert
        </Button>
      </p>
    )
  }

  return (
    <div className="vl-alert">
      <button
        id={`${formId}-trigger`}
        ref={trigger}
        type="button"
        className="vc-link"
        data-variant="standalone"
        aria-expanded={open}
        aria-controls={open ? formId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        Set price alert
      </button>
      {open ? (
        <form
          id={formId}
          className="vl-alert__form vl-panel"
          aria-label={`Set a price alert for ${deal.title}`}
          noValidate
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              trigger.current?.focus()
            }
          }}
          onSubmit={(e) => e.preventDefault()}
        >
          <strong className="vc-display">Set a price alert for {deal.title}</strong>
          <TextInput
            label="Alert me below"
            hint={`Today: ${money(deal.price)}.`}
            prefix="$"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(v) => {
              setValue(v)
              if (error) setError(null)
            }}
            error={error ?? (failed ? "We couldn't set the alert. Nothing changed. Try again." : undefined)}
          />
          <ActionButton
            type="submit"
            variant="secondary"
            pendingLabel="Setting alert…"
            successLabel="Alert set"
            successMessage={false}
            inlineError={false}
            errorMessage={(e) => (e instanceof InvalidPrice ? e.message : "We couldn't set the alert. Nothing changed. Try again.")}
            onAction={async (signal) => {
              const problem = validate(value, deal.price)
              setFailed(false)
              if (problem) throw new InvalidPrice(problem)
              await simulated(true, signal)
            }}
            onError={(e) => (e instanceof InvalidPrice ? setError(e.message) : setFailed(true))}
            onSuccess={() => {
              const below = parsePrice(value)
              if (below === null || validate(value, deal.price)) return
              alertStore.set(deal.id, below)
              setOpen(false)
              announce(`Alert set below ${money(below)}. Design study: no email is sent.`)
            }}
          >
            Set alert
          </ActionButton>
          <p className="vl-alert__note">Design study: no email is sent.</p>
        </form>
      ) : null}
    </div>
  )
}

/* One kiosk, wired to the cart, the alert and the scene. */
function DealKiosk({ deal, lead, children }: { deal: Deal; lead?: boolean; children?: ReactNode }): JSX.Element {
  const { items } = useCart()
  return (
    <Kiosk
      number={deal.kiosk}
      size={lead ? 'lead' : 'regular'}
      title={deal.title}
      platform={deal.platform}
      regionLine={REGION_LINE[deal.region]}
      price={deal.price}
      list={deal.list}
      meta={deal.meta}
      cover={deal.cover}
      inCart={items.includes(deal.id)}
      keyHint={`${PLATFORM_NAME[deal.platform]} key`}
      onIntent={() => sceneBus.emit({ type: 'pulse', kiosk: deal.kiosk })}
      onAdd={(signal) => simulated(true, signal)}
      onAdded={() => {
        cartStore.add(deal.id, deal.title)
        sceneBus.emit({ type: 'pulse', kiosk: deal.kiosk })
      }}
      onRemove={() => cartStore.remove(deal.id, deal.title)}
    >
      {children}
      <PriceAlert deal={deal} />
    </Kiosk>
  )
}

/* The stalls light up one column after another as the grid scrolls in. */
function Stall({ progress, column, lead, children }: { progress: MotionValue<number>; column: number; lead?: boolean; children: ReactNode }): JSX.Element {
  const reduce = useReducedMotion()
  const start = column * 0.08
  const clip = useTransform(progress, (p) => {
    const t = Math.min(1, Math.max(0, (p - start) / 0.55))
    return t >= 1 ? 'none' : `inset(0% 0% ${((1 - t) * 100).toFixed(1)}% 0%)`
  })
  return (
    <motion.li data-lead={lead || undefined} style={reduce ? undefined : { clipPath: clip }}>
      {children}
    </motion.li>
  )
}

function Words({ text, progress }: { text: string; progress: MotionValue<number> }): JSX.Element {
  const reduce = useReducedMotion()
  const words = text.split(' ')
  return (
    <>
      {words.map((w, i) => (
        <Word key={i} progress={progress} index={i} count={words.length} still={!!reduce}>
          {w}
        </Word>
      ))}
    </>
  )
}

function Word({ progress, index, count, still, children }: { progress: MotionValue<number>; index: number; count: number; still: boolean; children: string }): JSX.Element {
  const from = (index - (count - 1) / 2) * 24 // --travel-lg apart per word, settling to 0
  const x = useTransform(progress, [0, 0.5], [from, 0])
  return (
    <>
      <motion.span className="vl-word" style={still ? undefined : { x }}>
        {children}
      </motion.span>{' '}
    </>
  )
}

export function Deals(): JSX.Element {
  const [region, setRegion] = useState<VisitorRegion>('all')
  const [platform, setPlatform] = useState<PlatformFilter>('all')
  const resultRef = useRef<HTMLParagraphElement>(null)
  const section = useRef<HTMLElement>(null)
  const grid = useRef<HTMLUListElement>(null)
  const { scrollYProgress: headIn } = useScroll({ target: section, offset: ['start end', 'start 0.35'] })
  const { scrollYProgress: gridIn } = useScroll({ target: grid, offset: ['start 0.95', 'start 0.35'] })

  const byRegion = DEALS.filter((d) => worksIn(d.region, region))
  const shown = byRegion.filter((d) => platform === 'all' || d.platform === platform)
  const hiddenByRegion = DEALS.length - byRegion.length
  const platformName = platform === 'all' ? '' : PLATFORM_OPTIONS.find((p) => p.id === platform)?.label ?? ''

  function resultText(r: VisitorRegion, p: PlatformFilter): string {
    const reg = DEALS.filter((d) => worksIn(d.region, r))
    const list = reg.filter((d) => p === 'all' || d.platform === p)
    const pName = p === 'all' ? '' : `${PLATFORM_OPTIONS.find((o) => o.id === p)?.label} `
    if (r === 'all') return `${list.length} ${pName}${list.length === 1 ? 'key' : 'keys'}`
    const where = REGION_IN_TEXT[r]
    if (list.length === 0) return `No ${pName}deals work in ${where} today.`
    const hidden = DEALS.length - reg.length
    return `${list.length} ${pName}${list.length === 1 ? 'key works' : 'keys work'} in ${where}.${hidden ? ` ${hidden} hidden: they won't activate in ${where}.` : ''}`
  }

  function apply(r: VisitorRegion, p: PlatformFilter): void {
    setRegion(r)
    setPlatform(p)
    announce(resultText(r, p))
  }

  function reset(which: 'region' | 'platform'): void {
    apply(which === 'region' ? 'all' : region, which === 'platform' ? 'all' : platform)
    window.requestAnimationFrame(() => resultRef.current?.focus())
  }

  const showLead = shown.includes(LEAD)
  const rest = shown.filter((d) => d !== LEAD)

  return (
    <section ref={section} id="deals" data-chapter="deals" aria-labelledby="deals-title" className="vl-chapter">
      <div className="vl-wrap">
        <div className="vl-panel vl-deals__head">
          <div>
            <h2 id="deals-title" className="vl-h2" tabIndex={-1}>
              <Words text="Today's deals" progress={headIn} />
            </h2>
            <p className="vl-sub">8 keys, prices checked today at 09:00. Pick your region to hide keys that won't activate for you.</p>
          </div>
          <div className="vl-deals__filters">
            <div className="vl-deals__region" data-region-picker>
              <Select label="Your region" hint="Global keys work everywhere." value={region} options={REGION_OPTIONS} onChange={(r) => apply(r, platform)} />
            </div>
            <Segmented label="Platform" options={PLATFORM_OPTIONS} value={platform} onChange={(p) => apply(region, p)} />
          </div>
        </div>

        <p ref={resultRef} className="vl-deals__result" tabIndex={-1}>
          {resultText(region, platform)}
          {hiddenByRegion && region !== 'all' ? (
            <Button variant="quiet" onClick={() => reset('region')}>
              Show all regions
            </Button>
          ) : null}
        </p>

        {shown.length === 0 ? (
          <div className="vl-panel">
            <EmptyState
              kind="no-results"
              headingLevel={3}
              title={`No ${platformName} deals work in ${region === 'all' ? 'any region' : REGION_IN_TEXT[region]} today`}
              filters={[REGION_OPTIONS.find((r) => r.id === region)?.label ?? '', platformName].filter(Boolean)}
              action={
                <Button variant="secondary" onClick={() => reset('platform')}>
                  Show all platforms
                </Button>
              }
            >
              Global keys work everywhere; none are on {platformName} right now.
            </EmptyState>
          </div>
        ) : (
          <ul ref={grid} className="vl-deals__grid" aria-label="Today's deals">
            {showLead ? (
              <Stall progress={gridIn} column={0} lead>
                <div className="vl-lead">
                  <DealKiosk deal={LEAD} lead />
                  <div className="vl-lead__chart vl-panel">
                    <PriceChart points={LEAD_HISTORY} title={`${LEAD.title}: price over the last 90 days`} />
                    <p className="vl-lead__caption">
                      −{percentOff(LEAD.price, LEAD.list)}% is against the {money(LEAD.list)} list price, last seen Jul 26. Today's {money(LEAD.price)} is the lowest in 90 days. Sample data.
                    </p>
                  </div>
                </div>
              </Stall>
            ) : null}
            {rest.map((deal, i) => (
              <Stall key={deal.id} progress={gridIn} column={i % 3}>
                <DealKiosk deal={deal} />
              </Stall>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
