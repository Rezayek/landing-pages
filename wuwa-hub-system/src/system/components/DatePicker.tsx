import { useId, useMemo, useRef, useState, type JSX, type KeyboardEvent } from 'react'
import { IconButton } from './Button'
import { Icon } from './icons'

const DAY = 86_400_000
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const
const iso = (d: Date): string => d.toISOString().slice(0, 10)
const parse = (s: string): Date | null => (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? new Date(`${s}T00:00:00Z`) : null)

/**
 * Date input and picker: the typed field always works; the button opens a designed grid (non-modal). Arrows move by
 * day, Page Up/Down by month, Enter selects, Esc closes and returns focus. Days with a banner change carry a diamond.
 */
export function DatePicker({
  label,
  value,
  onChange,
  today,
  bannerDays = [],
  rangeEnd,
  initiallyOpen = false,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  /** ISO date treated as today (sample data). */
  today: string
  bannerDays?: readonly string[]
  /** Shows a range from `value` to this date. */
  rangeEnd?: string
  initiallyOpen?: boolean
}): JSX.Element {
  const id = useId()
  const button = useRef<HTMLSpanElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(initiallyOpen)
  const [draft, setDraft] = useState(value)
  const selected = parse(value) ?? parse(today)!
  const [focus, setFocus] = useState<Date>(selected)
  const [error, setError] = useState<string | null>(null)

  const days = useMemo(() => {
    const first = new Date(Date.UTC(focus.getUTCFullYear(), focus.getUTCMonth(), 1))
    const offset = (first.getUTCDay() + 6) % 7
    return Array.from({ length: 42 }, (_, i) => new Date(first.getTime() + (i - offset) * DAY))
  }, [focus])

  function commit(next: Date): void {
    onChange(iso(next))
    setDraft(iso(next))
    setError(null)
    setOpen(false)
    button.current?.querySelector('button')?.focus()
  }

  function onGridKey(event: KeyboardEvent<HTMLDivElement>): void {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (event.key in moves) {
      event.preventDefault()
      setFocus(new Date(focus.getTime() + moves[event.key] * DAY))
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      const d = new Date(focus)
      d.setUTCMonth(d.getUTCMonth() + (event.key === 'PageDown' ? 1 : -1))
      setFocus(d)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commit(focus)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      button.current?.querySelector('button')?.focus()
    }
  }

  const month = focus.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const end = rangeEnd ? parse(rangeEnd) : null

  return (
    <div className="ea-fld ea-select">
      <label className="ea-fld__label" htmlFor={id}>
        {label}
      </label>
      <span id={`${id}-hint`} className="ea-fld__hint">
        Like 2026-11-01
      </span>
      <div className="ea-input ea-frame" data-invalid={error ? true : undefined}>
        <Icon name="calendar" />
        <input
          id={id}
          value={draft}
          aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
          aria-invalid={error ? true : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const d = parse(draft)
            if (d) {
              onChange(iso(d))
              setFocus(d)
              setError(null)
            } else setError('Enter a date like 2026-11-01')
          }}
        />
        <span ref={button}>
          <IconButton icon="chevronDown" label={open ? 'Close calendar' : 'Open calendar'} onClick={() => setOpen((o) => !o)} />
        </span>
      </div>
      {error ? (
        <span id={`${id}-err`} className="ea-fld__msg" data-tone="error">
          <Icon name="error" />
          {error}
        </span>
      ) : null}
      {open ? (
        <div className="ea-pop ea-frame ea-cal" data-static={initiallyOpen || undefined} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
          <div className="ea-cal__head">
            <IconButton icon="chevronLeft" label="Previous month" onClick={() => setFocus(new Date(Date.UTC(focus.getUTCFullYear(), focus.getUTCMonth() - 1, 1)))} />
            <span aria-live="polite">{month}</span>
            <IconButton icon="chevronRight" label="Next month" onClick={() => setFocus(new Date(Date.UTC(focus.getUTCFullYear(), focus.getUTCMonth() + 1, 1)))} />
          </div>
          <div className="ea-cal__grid" role="group" aria-label={month} ref={grid} onKeyDown={onGridKey}>
            {WEEKDAYS.map((d) => (
              <span key={d} className="ea-cal__dow" aria-hidden="true">
                {d}
              </span>
            ))}
            {days.map((d) => {
              const key = iso(d)
              const isFocus = key === iso(focus)
              const inRange = end && d > selected && d <= end
              return (
                <button
                  key={key}
                  type="button"
                  className="ea-cal__day"
                  tabIndex={isFocus ? 0 : -1}
                  aria-pressed={key === value}
                  aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                  data-outside={d.getUTCMonth() !== focus.getUTCMonth() || undefined}
                  data-today={key === today || undefined}
                  data-banner={bannerDays.includes(key) || undefined}
                  data-range={inRange || undefined}
                  ref={(el) => {
                    if (el && isFocus && open && document.activeElement?.closest('.ea-cal__grid')) el.focus()
                  }}
                  onClick={() => commit(d)}
                >
                  {d.getUTCDate()}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
