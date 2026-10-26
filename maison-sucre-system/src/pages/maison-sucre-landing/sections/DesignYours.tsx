/**
 * S4 Design yours (UX.md §S4, Q4 "How much is this going to cost us? How many tiers for our numbers?"): the live
 * builder and the servings guide. Guests suggest the tiers (ServingsTable), then tiers, shape, finish, sugar flowers,
 * gold leaf and a flavour for each tier; the stand (3D, the drawing without WebGL) and the sample price stay in view.
 *
 * The design lives in Page and is controlled here (`design`, `onDesign`). Behaviour follows BuilderScenario and
 * ServingsScenario in src/system/scenarios; every figure is a labelled sample (cake/data.ts).
 */
import { useId, useState, useSyncExternalStore, type JSX } from 'react'
import { ActionButton, InlineMessage, announce } from '@/system/feedback'
import { CopyIcon } from '@/system/feedback/icons'
import { SimulatedFailure, simulate, wait, type LatencyId } from '@/system/latency'
import { BeadBorder, Button, Checkbox, ChoiceChips, Field, NumberStepper, Segmented, Select, TextLink } from '@/system/ui'
import {
  CakeStand,
  FLAVOURS,
  GUESTS,
  HEXAGON_MAX_TIERS,
  Poster,
  PriceRange,
  ServingsTable,
  pounds,
  priceFor,
  tiersForGuests,
  type Design,
  type Finish,
  type Flowers,
  type Shape,
} from '@/system/cake'
import './design-yours.css'

export interface DesignYoursProps {
  latency: LatencyId
  /** The design being built; Page holds it, starting as the film's cake. */
  design: Design
  onDesign: (design: Design) => void
}

/** The film's cake, the same as Page's starting design: "Start again" returns to it. */
const FILM_DESIGN: Design = {
  tiers: 4,
  shape: 'round',
  finish: 'fondant',
  flowers: 'cascade',
  goldLeaf: true,
  flavours: ['pistachio-rose', 'lemon-elderflower', 'chocolate-caramel', 'vanilla-raspberry'],
}

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

class OfflineError extends Error {
  constructor() {
    super('You are not connected.')
    this.name = 'OfflineError'
  }
}

/** CONTENT.md §Errors: the cause and the fix, from the real state; the design is kept. */
function failureText(error: unknown): string {
  if (error instanceof OfflineError) return "You're not connected, so we could not reach the kitchen. Check your connection, then try again."
  if (error instanceof SimulatedFailure) return "The kitchen's system did not answer. Try again in a moment."
  return 'This took longer than it should. Try again in a moment.'
}

const subscribeOnline = (notify: () => void): (() => void) => {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}

/** A short, stable code for a design: the sample link names it. */
function codeFor(design: Design): string {
  const text = JSON.stringify(design)
  let h = 7
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
}

export function DesignYours({ latency, design, onDesign }: DesignYoursProps): JSX.Element {
  const [guests, setGuests] = useState<number | null>(null)
  const [saved, setSaved] = useState<{ key: string; link: string } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)
  const tiersId = useId()
  const flavoursId = useId()

  const set = (patch: Partial<Design>): void => {
    setSaveError(null)
    const next = { ...design, ...patch }
    if (next.shape === 'hexagon' && next.tiers > HEXAGON_MAX_TIERS) next.tiers = HEXAGON_MAX_TIERS
    // one flavour per tier: a new tier takes the one above it
    const flavours = Array.from({ length: next.tiers }, (_, i) => next.flavours[i] ?? next.flavours[next.flavours.length - 1] ?? FLAVOURS[0].id)
    onDesign({ ...next, flavours })
  }

  const range = priceFor(design)
  const complete = design.tiers >= 3 && design.flowers !== 'none'
  const key = JSON.stringify(design)
  const link = saved && saved.key === key ? saved.link : null

  return (
    <section id="design" className="design" aria-labelledby="design-title">
      <div className="design__inner">
        <header className="design__head">
          <h2 id="design-title" tabIndex={-1} className="text-[length:var(--step-3)]">
            Design yours
          </h2>
          <p className="design__sub text-[length:var(--step-1)]">Watch the sample price change as you choose.</p>
          <BeadBorder variant="shell" />
        </header>

        <div className="design__builder">
          <div className="design__controls">
            {/* no first-use card: the builder always holds a cake (the film's, or one from the gallery); the guest
                field's hint carries the first step */}
            <ServingsTable
              guests={guests}
              tiers={design.tiers}
              onGuests={(g) => {
                setGuests(g)
                if (g >= GUESTS.min && g <= GUESTS.max) {
                  const t = tiersForGuests(g, design.shape)
                  if (t) set({ tiers: t })
                }
              }}
            />

            <div className="design__fields">
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
                options={SHAPES.map((s) => ({
                  ...s,
                  disabledReason: s.value === 'hexagon' && design.tiers > HEXAGON_MAX_TIERS ? 'Hexagon cakes go up to four tiers (sample rule)' : undefined,
                }))}
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

              <fieldset className="design__flavours">
                <legend className="ms-field__label">Flavour per tier, top to bottom</legend>
                {design.flavours.map((fid, i) => (
                  <div key={i} className="design__flavour">
                    <label className="ms-figure" htmlFor={`${flavoursId}-${i}`}>
                      Tier {i + 1}
                    </label>
                    <Select
                      id={`${flavoursId}-${i}`}
                      value={fid}
                      onChange={(e) => set({ flavours: design.flavours.map((x, k) => (k === i ? e.target.value : x)) })}
                    >
                      {FLAVOURS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </fieldset>
            </div>

            <div className="design__actions">
              <ActionButton
                variant="primary"
                pendingLabel="Saving…"
                successLabel="Saved"
                successMessage="Design saved"
                errorLabel="Try again"
                onAction={async (signal) => {
                  setSaveError(null)
                  if (!navigator.onLine) {
                    await wait(120, signal)
                    throw new OfflineError()
                  }
                  await simulate(latency, true, signal)
                  setSaved({ key, link: `maisonsucre.example/d/${codeFor(design)}` })
                }}
                onError={(e) => setSaveError(failureText(e))}
              >
                Save my design
              </ActionButton>
              <Button
                variant="quiet"
                onClick={() => {
                  setSaveError(null)
                  onDesign(FILM_DESIGN)
                  announce('Started again with the film’s cake.')
                }}
              >
                Start again
              </Button>
            </div>

            {link ? (
              // the keepsake: the saved cake as a card worth keeping or sending (agreed, round 1: C3)
              <figure className="design__keep ms-scallop" data-scenario="keepsake">
                <div className="design__keep-cake">
                  <Poster design={design} />
                </div>
                <figcaption className="design__keep-text">
                  <h3 className="design__keep-title">Your cake</h3>
                  <p className="design__keep-facts">
                    {design.tiers} tiers · about {range.portions} portions · {design.flavours.map((id) => FLAVOURS.find((f) => f.id === id)?.name).filter(Boolean).join(', ')}
                  </p>
                  <p className="design__keep-price">
                    <span className="design__keep-fleck" aria-hidden="true" />
                    {pounds(range.low)} to {pounds(range.high)} <span className="design__keep-note">(sample price)</span>
                  </p>
                  <p className="design__keep-link">{link} (sample)</p>
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
                </figcaption>
              </figure>
            ) : null}
            {saveError ? (
              <InlineMessage tone="error" title="Your design is not saved yet">
                {saveError} Or{' '}
                <a className="ms-link" href="mailto:hello@maisonsucre.example">
                  email hello@maisonsucre.example
                </a>
              </InlineMessage>
            ) : null}
          </div>

          <div className="ms-stand-pin design__stand">
            <CakeStand design={design} variant="builder" failLive={!online} />
            <PriceRange range={range} tiers={design.tiers} complete={complete} />
            <p className="design__links">
              <TextLink standalone href="#tastings">
                Book a tasting for this design
              </TextLink>
              <TextLink standalone href="#quote">
                Ask for a quote
              </TextLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
