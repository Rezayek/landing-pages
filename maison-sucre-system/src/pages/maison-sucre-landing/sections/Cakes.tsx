/**
 * S3 Cakes (UX.md §S3, Q3 "What kind of cakes do you make?"): the range by style, a card opens the cake's details,
 * and "Design one like this" loads that cake's design into S4.
 *
 * Built from the system: ChoiceChips (petal dust by style), CakeCard (a tall, framed rendered study, steal list 7),
 * Region (skeleton on first load, dim and bar on refresh), ErrorState, EmptyState, InlineMessage, Dialog. The shell
 * rule under the heading is the system's BeadBorder (steal list 8: a single noun in a large serif, then a quiet rule).
 * Behaviour follows GalleryScenario in src/system/scenarios; every picture is a rendered study and every price a sample.
 */
import { useCallback, useEffect, useId, useRef, useState, type JSX } from 'react'
import { EmptyState, ErrorState, InlineMessage, Region, announce } from '@/system/feedback'
import { SimulatedFailure, isAbort, simulate, wait, type LatencyId } from '@/system/latency'
import { durationMs, prefersReducedMotion } from '@/system/motion'
import { BeadBorder, Button, ChoiceChips, Dialog, Field, Select } from '@/system/ui'
import {
  CAKES,
  CakeCard,
  CakeCardSkeleton,
  FLAVOURS,
  renderOf,
  STYLES,
  portionsFor,
  pounds,
  priceFor,
  type Cake,
  type Design,
  type Style,
} from '@/system/cake'
import './cakes.css'

export interface CakesProps {
  latency: LatencyId
  /** Receives the opened cake's design; S4 holds it. */
  onDesign: (design: Design) => void
}

/** The network is down: the request never reaches the kitchen. */
class OfflineError extends Error {
  constructor() {
    super('You are not connected.')
    this.name = 'OfflineError'
  }
}

/** CONTENT.md §Errors: the cause and the fix, from the real state. */
function failureText(error: unknown): string {
  if (error instanceof OfflineError) return "You're not connected, so we could not reach the kitchen. Check your connection, then try again."
  if (error instanceof SimulatedFailure) return "The kitchen's system did not answer. Try again in a moment."
  return 'This took longer than it should. Try again in a moment.'
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

/** The cake as a design for the builder: its own tiers, shape, finish and flowers, a flavour for each tier. */
function designOf(cake: Cake): Design {
  return {
    tiers: cake.tiers,
    shape: cake.shape,
    finish: cake.finish,
    flowers: cake.flowers,
    goldLeaf: cake.style === 'modern', // the same rule the card's sample price uses
    flavours: FLAVOURS.slice(0, cake.tiers).map((f) => f.id),
  }
}

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five']

/** The empty state's second sentence: the style's real limit when the tier count is the cause. */
function emptyAdvice(style: Style | null, tiers: string): string {
  if (!style || tiers === 'any') return 'See every style, or ask us about this one.'
  const label = STYLES.find((s) => s.value === style)?.label.toLowerCase() ?? style
  const most = Math.max(0, ...CAKES.filter((c) => c.style === style).map((c) => c.tiers))
  // the copy in UX.md §S3 for its own example, "Naked" and 5 tiers
  const upTo = style === 'naked' && tiers === '5' ? 'four' : NUMBER_WORDS[most] ?? String(most)
  return `Our ${label} cakes go up to ${upTo} tiers. Try fewer tiers, or see every style.`
}

/** One cake's picture in the details: the style's petal dust until it loads, a line if it does not. */
function DetailPicture({ cake }: { cake: Cake }): JSX.Element {
  const [state, setState] = useState<'loading' | 'loaded' | 'failed'>('loading')
  const style = STYLES.find((s) => s.value === cake.style) ?? STYLES[0]
  return (
    <figure className="cakes-detail__pic" data-petal={style.petal} data-state={state}>
      {state === 'failed' ? (
        <span className="cakes-detail__failed">Picture did not load</span>
      ) : (
        <img
          src={renderOf(cake)}
          width={1200}
          height={1500}
          decoding="async"
          alt={`${cake.name}: a rendered study of a ${cake.style} cake`}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      )}
      <figcaption className="cakes-detail__credit">Rendered study</figcaption>
    </figure>
  )
}

export function Cakes({ latency, onDesign }: CakesProps): JSX.Element {
  const [style, setStyle] = useState<Style | null>(null)
  const [tiers, setTiers] = useState<string>('any')
  const [cakes, setCakes] = useState<readonly Cake[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [open, setOpen] = useState<Cake | null>(null)
  // A9: the first load starts when the section nears the view
  const [armed, setArmed] = useState(() => typeof IntersectionObserver === 'undefined')
  const root = useRef<HTMLElement>(null)
  const controller = useRef<AbortController | null>(null)
  const tierId = useId()

  useEffect(() => {
    const el = root.current
    if (armed || !el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true)
          io.disconnect()
        }
      },
      { rootMargin: '240px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [armed])

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
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          await wait(120, own.signal)
          throw new OfflineError()
        }
        const found = await simulate(latency, match, own.signal)
        setError(null)
        setCakes(found)
        // a retry that worked replaces the error with the cakes: focus goes to the first of them, not the page
        if (retrying) requestAnimationFrame(() => document.querySelector<HTMLElement>('#cakes .ms-cakegrid :is(a, button)')?.focus())
        const what = style ? `${STYLES.find((s) => s.value === style)?.label.toLowerCase()} cakes` : 'cakes'
        announce(found.length ? `${found.length} ${found.length === 1 ? what.replace(/cakes$/, 'cake') : what}` : `No ${what} match`)
      } catch (failure) {
        if (!isAbort(failure)) setError(failure)
      } finally {
        if (controller.current === own) setBusy(false)
      }
    },
    [latency, style, tiers],
  )

  useEffect(() => {
    if (!armed) return
    // oxlint-disable-next-line react/set-state-in-effect -- the request starts here; load() sets its busy state first
    void load()
    return () => controller.current?.abort()
  }, [load, armed])

  const filters = [style ? STYLES.find((s) => s.value === style)?.label : null, tiers !== 'any' ? `${tiers} tiers` : null].filter(Boolean) as string[]

  /** A13: S4 holds this cake's design; the dialog gives its focus back first, then focus lands on the builder heading. */
  const designLikeThis = (cake: Cake): void => {
    onDesign(designOf(cake))
    setOpen(null)
    const reduce = prefersReducedMotion()
    window.setTimeout(
      () => {
        document.getElementById('design')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
        document.getElementById('design-title')?.focus({ preventScroll: true })
      },
      reduce ? 50 : durationMs.lg + 50,
    )
  }

  // one slot per cake of the first (unfiltered) load, so the grid does not jump when the cakes arrive (A9)
  const skeleton = (
    <div className="ms-cakegrid">
      {CAKES.map((c) => (
        <CakeCardSkeleton key={c.id} petal={STYLES.find((s) => s.value === c.style)?.petal ?? STYLES[0].petal} />
      ))}
    </div>
  )

  const detail = open ? designOf(open) : null
  return (
    <section id="cakes" ref={root} className="cakes" aria-labelledby="cakes-title">
      <div className="cakes__inner">
        <header className="cakes__head">
          <h2 id="cakes-title" className="text-[length:var(--step-3)]">
            Cakes
          </h2>
          <p className="cakes__sub text-[length:var(--step-1)]">Five styles, each made by hand to order. The pictures here are rendered studies.</p>
          <BeadBorder variant="shell" />
        </header>

        <div className="cakes__filters">
          <ChoiceChips
            legend="Style"
            options={STYLES.map((s) => ({ value: s.value, label: s.label, petal: s.petal, count: CAKES.filter((c) => c.style === s.value).length }))}
            value={style}
            onChange={setStyle}
          />
          <Field id={tierId} label="Tiers" className="cakes__tiers">
            <Select id={tierId} value={tiers} onChange={(e) => setTiers(e.target.value)}>
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
          <ErrorState title="We could not load the cakes just now" onRetry={(signal) => load(signal)} secondary={<EmailUs />}>
            {failureText(error)}
          </ErrorState>
        ) : (
          <>
            {error && cakes ? (
              <InlineMessage
                tone="error"
                title="We could not refresh the cakes"
                announceText="We could not refresh the cakes."
                action={
                  <Button variant="quiet" onClick={() => void load()}>
                    Try again
                  </Button>
                }
              >
                The cakes below are from before. {failureText(error)}
              </InlineMessage>
            ) : null}
            <Region
              label="cakes"
              busy={busy}
              hasContent={cakes !== null}
              minHeight="24rem"
              fallback={skeleton}
            >
              {/* before the first load starts (the section is still far below), the same slots hold the space unseen,
                  so a jump past the gallery (the nav's "Design yours") does not land on a page that then moves */}
              {cakes === null && !busy ? (
                <div aria-hidden="true" style={{ visibility: 'hidden' }}>
                  {skeleton}
                </div>
              ) : null}
              {cakes && cakes.length === 0 ? (
                filters.length ? (
                  <EmptyState
                    kind="no-results"
                    title={`No cakes match ${filters.map((f) => `"${f}"`).join(' and ')}`}
                    filters={filters}
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
                    {emptyAdvice(style, tiers)}
                  </EmptyState>
                ) : (
                  <EmptyState kind="first-use" title="The gallery is being restocked" secondary={<EmailUs />}>
                    New cakes appear here as we finish them. Ask us for pictures of a style you love.
                  </EmptyState>
                )
              ) : cakes ? (
                <div className="ms-cakegrid">
                  {cakes.map((cake) => (
                    <CakeCard key={cake.id} cake={cake} onOpen={setOpen} />
                  ))}
                </div>
              ) : null}
            </Region>
          </>
        )}
      </div>

      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name ?? ''}
        actions={
          <>
            <Button variant="primary" onClick={() => open && designLikeThis(open)}>
              Design one like this
            </Button>
            <Button variant="quiet" onClick={() => setOpen(null)}>
              Close
            </Button>
          </>
        }
      >
        {open && detail ? (
          <div className="cakes-detail">
            <DetailPicture cake={open} />
            <div className="cakes-detail__text">
              <p>{open.note}</p>
              <p className="ms-figure">
                {open.tiers} tiers · about {portionsFor(open.tiers, open.shape)} portions · {open.shape} · {open.finish}
              </p>
              <p className="ms-figure">From {pounds(priceFor(detail).low)} (sample price)</p>
            </div>
          </div>
        ) : null}
      </Dialog>
    </section>
  )
}
