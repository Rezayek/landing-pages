import { useEffect, useId, useRef, type JSX } from 'react'
import { announce } from '../feedback'
import { Field, NumberStepper, describedBy } from '../ui'
import { GUESTS, TIER_SIZES, portionsFor, tiersForGuests } from './data'

export interface ServingsTableProps {
  guests: number | null
  onGuests: (guests: number) => void
  /** The tiers of the cake being designed: drawn until a guest count marks the cake that serves them. */
  tiers?: number
}

/** The side drawing: tiers to scale with dimension lines that annotate (FOUNDATIONS.md §6: lines that measure). */
function TierDrawing({ tiers }: { tiers: number }): JSX.Element {
  const sizes = [...(TIER_SIZES[tiers] ?? TIER_SIZES[3])].reverse() // bottom first
  const unit = 13 // drawing units per inch
  const h = 4 * unit
  let y = 20 + sizes.length * h
  return (
    <svg viewBox={`0 0 260 ${40 + sizes.length * h}`} role="img" aria-label={`${tiers} tiers: ${[...sizes].reverse().join(', ')} inch`}>
      {sizes.map((size, i) => {
        const w = size * unit
        y -= h
        const x = 130 - w / 2
        return (
          <g key={`${size}-${i}`}>
            <rect x={x} y={y} width={w} height={h - 2} rx={3} fill="var(--surface)" stroke="currentColor" strokeWidth="1.5" />
            <line x1={x} y1={y + h + 3} x2={x + w} y2={y + h + 3} stroke="var(--bead)" strokeWidth="1" strokeDasharray="1 4" />
            <text x={130} y={y + h / 2 + 5} textAnchor="middle" fontSize="13" fill="currentColor">
              {size} in
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * The tiers and servings guide (COMPONENTS.md §Servings table): a guest stepper marks the smallest cake that serves
 * them; the table is the answer, the drawing shows the proportions. A sample guide (1 × 1 inch wedding portions).
 */
export function ServingsTable({ guests, onGuests, tiers = 3 }: ServingsTableProps): JSX.Element {
  const id = useId()
  const match = guests !== null && guests >= GUESTS.min && guests <= GUESTS.max ? tiersForGuests(guests) : null
  const out = guests !== null && (guests < GUESTS.min || guests > GUESTS.max)
  const said = useRef('')
  useEffect(() => {
    if (match === null || guests === null) return
    const text = `A ${match}-tier cake serves about ${portionsFor(match, 'round')}`
    const timer = window.setTimeout(() => {
      if (said.current !== text) announce(text)
      said.current = text
    }, 400)
    return () => window.clearTimeout(timer)
  }, [match, guests])
  const message = out ? `Guests must be between ${GUESTS.min} and ${GUESTS.max}. For more, ask us about a larger cake.` : undefined
  return (
    <div className="ms-servings">
      <div className="ms-servings__draw">
        <TierDrawing tiers={match ?? tiers} />
      </div>
      <div style={{ display: 'grid', gap: 'var(--gap-group)' }}>
        <Field id={id} label="How many guests?" hint={guests === null ? "We'll mark the cake that serves them." : undefined} message={message}>
          <NumberStepper
            id={id}
            value={guests ?? 100}
            min={1}
            max={999}
            bigStep={10}
            unit="guests"
            invalid={out}
            describedBy={describedBy(id, guests === null, !!message)}
            onChange={onGuests}
          />
        </Field>
        {/* below ~520 px each row stacks into a small card (cake.css container query): no sideways scroll */}
        <div className="ms-servings__wrap">
          <table className="ms-table" data-density="compact">
            <caption>Tiers and portions · sample guide: wedding portions 1 × 1 inch</caption>
            <thead>
              <tr>
                <th scope="col">Tiers</th>
                <th scope="col">Sizes (inch)</th>
                <th scope="col">Wedding portions</th>
                <th scope="col">Dessert portions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((t) => {
                const p = portionsFor(t, 'round')
                return (
                  <tr key={t} aria-current={match === t || undefined}>
                    <td data-label="Tiers"><span className="ms-numeral">{t}</span></td>
                    <td data-label="Sizes (inch)">{TIER_SIZES[t].join(', ')}</td>
                    <td data-label="Wedding portions">
                      {p}
                      {match === t ? <span className="ms-table__fits">fits {guests}</span> : null}
                    </td>
                    <td data-label="Dessert portions">{Math.floor(p / 2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
