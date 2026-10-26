import { useRef, type JSX } from 'react'
import { CheckIcon } from '../feedback/icons'
import { Skeleton } from '../feedback'
import { play } from '../vfx'

export interface Slot {
  time: string
  /** Booked by someone else, possibly while the couple was looking (live). */
  taken?: boolean
  /** Taken in this session after the slots loaded: the label says "just taken". */
  takenLive?: boolean
}

export interface TimeSlotsProps {
  legend: string
  slots: readonly Slot[]
  value: string | null
  onChange: (time: string) => void
  /** "Times checked just now": when the availability was last read. */
  freshness?: string
  invalid?: boolean
  describedBy?: string
}

/**
 * A tasting time on a chosen day, as a radio group of pearl pills (COMPONENTS.md §Time-slot picker). A slot taken
 * while the couple looks changes its label and strikes in place: it never moves and the list never reorders
 * (MOTION-SYSTEM.md: live update arriving). A focused slot that is taken keeps focus and its new label is read.
 */
export function TimeSlots({ legend, slots, value, onChange, freshness, invalid, describedBy }: TimeSlotsProps): JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const open = slots.filter((s) => !s.taken).length
  const focusAt = (i: number): void => refs.current[(i + slots.length) % slots.length]?.focus()
  const selectedIndex = slots.findIndex((s) => s.time === value)
  return (
    <fieldset className="ms-slots" role="radiogroup" aria-invalid={invalid || undefined} aria-describedby={describedBy}>
      <legend>{legend}</legend>
      <div className="ms-slots__row">
        {slots.map((slot, i) => {
          const on = slot.time === value && !slot.taken
          const label = slot.taken ? `${slot.time}, ${slot.takenLive ? 'just taken' : 'full'}` : slot.time
          return (
            <button
              key={slot.time}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              className="ms-slot"
              aria-checked={on}
              aria-disabled={slot.taken || undefined}
              aria-label={label}
              tabIndex={on || (selectedIndex < 0 && i === 0) ? 0 : -1}
              onClick={(e) => {
                if (slot.taken) return
                onChange(slot.time)
                void play(e.currentTarget, 'dust')
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  focusAt(i + 1)
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  focusAt(i - 1)
                }
              }}
            >
              {on ? (
                <span data-vfx-play="pipe" style={{ display: 'inline-flex' }}>
                  <CheckIcon />
                </span>
              ) : null}
              <span className="ms-slot__time">{slot.time}</span>
              {slot.taken ? <span aria-hidden="true">· {slot.takenLive ? 'just taken' : 'full'}</span> : null}
            </button>
          )
        })}
      </div>
      <span className="ms-slots__left">
        {open === 1 ? '1 time left' : `${open} times left`}
        {freshness ? ` · ${freshness}` : ''}
      </span>
    </fieldset>
  )
}

/** The slots' skeleton: six pills in the same row, so the swap moves nothing. */
export function TimeSlotsSkeleton({ legend }: { legend: string }): JSX.Element {
  return (
    <div className="ms-slots" aria-hidden="true">
      <span className="ms-field__label">{legend}</span>
      <div className="ms-slots__row">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rect" className="ms-slot-skel" width="5.25rem" height="var(--tap-min)" />
        ))}
      </div>
      <span className="ms-slots__left">&nbsp;</span>
    </div>
  )
}
