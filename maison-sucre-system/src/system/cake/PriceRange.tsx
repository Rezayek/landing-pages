import { useLayoutEffect, useRef, type JSX } from 'react'
import { announce } from '../feedback'
import { BeadBorder } from '../ui'
import { countTo, play } from '../vfx'
import { pounds, type PriceRange as Range } from './data'

export interface PriceRangeProps {
  range: Range
  tiers: number
  /** The couple's budget, when given: a low end above it shows a warning line. */
  budget?: number
  /** A complete design (3+ tiers with flowers): the bead edge turns gold, still (no glint since 0.3.0). */
  complete?: boolean
}

/**
 * The live sample price of the cake being built (COMPONENTS.md §Price range): the figures roll to their new values
 * in tabular figures with no reflow ('count') and the gold fleck is pressed on once ('gild'); since 0.3.0 (calmer motion)
 * a complete design gets no glint. The new range is announced once the couple
 * pauses for 1 s. It always says "sample price".
 */
export function PriceRange({ range, tiers, budget, complete }: PriceRangeProps): JSX.Element {
  const low = useRef<HTMLSpanElement>(null)
  const high = useRef<HTMLSpanElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const fleck = useRef<HTMLSpanElement>(null)
  const last = useRef<Range | null>(null)

  // the figures' text is owned here, not by React, so the roll and the render never fight over it
  useLayoutEffect(() => {
    const prev = last.current
    last.current = range
    if (!prev) {
      void play(fleck.current, 'gild')
      if (low.current) low.current.textContent = pounds(range.low)
      if (high.current) high.current.textContent = pounds(range.high)
      return
    }
    const stopLow = countTo(low.current, prev.low, range.low, pounds)
    const stopHigh = countTo(high.current, prev.high, range.high, pounds)
    const timer = window.setTimeout(() => announce(`Now ${pounds(range.low)} to ${pounds(range.high)}, sample price`), 1000)
    return () => {
      stopLow()
      stopHigh()
      window.clearTimeout(timer)
    }
  }, [range])

  const over = budget !== undefined && range.low > budget
  return (
    <div className="ms-price ms-scallop" ref={card} data-complete={complete || undefined}>
      <span className="ms-price__facts">
        {tiers} {tiers === 1 ? 'tier' : 'tiers'} · about {range.portions} portions
      </span>
      <output className="ms-price__range" aria-live="off">
        <span className="ms-price__fig" ref={low} />
        <span aria-hidden="true">–</span>
        <span className="ms-price__fig" ref={high} />
        <span className="ms-price__fleck" ref={fleck} aria-hidden="true" />
      </output>
      <span className="ms-price__note">{range.note}</span>
      {over ? (
        <span className="ms-field__msg" data-tone="warning">
          Over the budget you gave us: try fewer tiers or a buttercream finish.
        </span>
      ) : null}
      <BeadBorder arrive={false} />
    </div>
  )
}
