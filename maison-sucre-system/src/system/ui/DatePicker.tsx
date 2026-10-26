import { useEffect, useId, useRef, useState, type JSX } from 'react'
import { CalendarIcon, ChevronIcon } from '../feedback/icons'
import { Spinner } from '../feedback'
import { Field, TextInput, describedBy } from './Field'
import { IconButton } from './Button'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** "Sat 15 Nov 2026": the content standard's date (CONTENT.md, writing rules). */
export function formatDate(date: Date, withYear = true): string {
  const day = DAYS[(date.getDay() + 6) % 7]
  return `${day} ${date.getDate()} ${MONTHS[date.getMonth()]}${withYear ? ` ${date.getFullYear()}` : ''}`
}

const sameDay = (a: Date | null, b: Date | null): boolean =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** Reads "15 Nov 2026", "15 November 2026", "15/11/2026" or "2026-11-15". Null when it is not a real date. */
export function parseDate(text: string): Date | null {
  const t = text.trim()
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(t)
  if (m) return real(Number(m[3].length === 2 ? `20${m[3]}` : m[3]), Number(m[2]) - 1, Number(m[1]))
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t)
  if (m) return real(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  m = /^(?:[a-z]{3,}\s+)?(\d{1,2})\s+([a-z]{3,})\s*(\d{4})?$/i.exec(t)
  if (m) {
    const month = MONTHS.findIndex((name) => m![2].toLowerCase().startsWith(name.toLowerCase()))
    if (month >= 0) return real(Number(m[3] ?? new Date().getFullYear()), month, Number(m[1]))
  }
  return null
}

function real(y: number, mo: number, d: number): Date | null {
  const date = new Date(y, mo, d)
  return date.getFullYear() === y && date.getMonth() === mo && date.getDate() === d ? date : null
}

export interface DayRule {
  /** Why the day cannot be chosen ("full", "the kitchen is closed"); undefined when it can. */
  unavailable?: string
}

export interface DatePickerProps {
  id: string
  label: string
  /** Defaults to a written example of the format; never a placeholder, which reads as a date already chosen. */
  hint?: string
  value: Date | null
  onChange: (date: Date | null) => void
  /** Per-day availability (a tasting calendar); every day is open when left out. */
  rule?: (date: Date) => DayRule
  /** The field's message (an error or the Monday warning) and its tone. */
  message?: string
  tone?: 'error' | 'warning'
  /** The month's availability is loading: days dim and the turntable shows in the header after 400 ms. */
  busy?: boolean
  /** Show the grid open, in place (the /system page and the booking flow). */
  inline?: boolean
  today?: Date
}

/**
 * A designed month grid with a typed input beside it (COMPONENTS.md §Date picker). Typing always works. The grid
 * follows the grid pattern: arrows by day, Page Up/Down by month, Home/End to the week's ends, Enter selects, Esc
 * closes and returns focus to the calendar button. Unavailable days stay visible and say why.
 */
export function DatePicker({ id, label, hint = 'For example Sat 15 Nov 2026', value, onChange, rule, message, tone = 'error', busy, inline, today = new Date() }: DatePickerProps): JSX.Element {
  const [open, setOpen] = useState(!!inline)
  const [text, setText] = useState(value ? formatDate(value) : '')
  const [cursor, setCursor] = useState<Date>(value ?? today)
  const gridId = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText(value ? formatDate(value) : '')
    if (value) setCursor(value)
  }, [value])

  useEffect(() => {
    if (!open || inline) return
    const cell = grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')
    cell?.focus()
  }, [open, inline])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => {
    const d = i - lead + 1
    return d >= 1 && d <= days ? new Date(year, month, d) : null
  })

  const shift = (n: number): void => setCursor(new Date(year, month, cursor.getDate() + n))
  const close = (): void => {
    if (inline) return
    setOpen(false)
    wrap.current?.querySelector<HTMLButtonElement>('.ms-iconbtn')?.focus()
  }
  const pick = (date: Date): void => {
    if (rule?.(date).unavailable) return
    onChange(date)
    close()
  }

  const picker = (
    <div className="ms-date__pop" data-inline={inline || undefined} role="dialog" aria-label={`Choose ${label.toLowerCase()}`}>
      <div className="ms-date__head">
        <IconButton label="Previous month" icon={<span style={{ display: 'inline-flex', transform: 'rotate(90deg)' }}><ChevronIcon /></span>} onClick={() => setCursor(new Date(year, month - 1, 1))} />
        <span className="ms-date__month" aria-live="polite">
          {LONG_MONTHS[month]} {year}
        </span>
        {busy ? (
          <span className="ms-date__busy">
            <Spinner size="sm" label="Loading the month" />
          </span>
        ) : null}
        <IconButton label="Next month" icon={<span style={{ display: 'inline-flex', transform: 'rotate(-90deg)' }}><ChevronIcon /></span>} onClick={() => setCursor(new Date(year, month + 1, 1))} />
      </div>
      <div
        id={gridId}
        ref={grid}
        className="ms-date__grid"
        role="grid"
        aria-busy={busy || undefined}
        onKeyDown={(e) => {
          const moves: Record<string, () => void> = {
            ArrowLeft: () => shift(-1),
            ArrowRight: () => shift(1),
            ArrowUp: () => shift(-7),
            ArrowDown: () => shift(7),
            PageUp: () => setCursor(new Date(year, month - 1, Math.min(cursor.getDate(), 28))),
            PageDown: () => setCursor(new Date(year, month + 1, Math.min(cursor.getDate(), 28))),
            Home: () => shift(-((cursor.getDay() + 6) % 7)),
            End: () => shift(6 - ((cursor.getDay() + 6) % 7)),
            Escape: close,
          }
          if (e.key in moves) {
            e.preventDefault()
            moves[e.key]()
            requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>('[tabindex="0"]')?.focus())
          }
        }}
      >
        <div role="row" className="ms-date__row">
          {DAYS.map((d) => (
            <span key={d} className="ms-date__dow" role="columnheader" aria-label={d}>
              {d.slice(0, 2)}
            </span>
          ))}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, w) => (
          <div key={`w${w}`} role="row" className="ms-date__row">
            {cells.slice(w * 7, w * 7 + 7).map((date, k) => {
              const i = w * 7 + k
          if (!date) return <span key={`x${i}`} className="ms-day" data-out="" role="gridcell" aria-hidden="true" />
          const why = rule?.(date).unavailable
          return (
            <button
              key={date.toISOString()}
              type="button"
              role="gridcell"
              className="ms-day"
              tabIndex={sameDay(date, cursor) ? 0 : -1}
              aria-selected={sameDay(date, value)}
              aria-disabled={why ? true : undefined}
              aria-current={sameDay(date, today) ? 'date' : undefined}
              aria-label={`${formatDate(date)}${why ? `, ${why}` : ''}`}
              onClick={() => pick(date)}
            >
              {date.getDate()}
            </button>
          )
            })}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Field id={id} label={label} hint={hint} message={message} tone={tone}>
      <div className="ms-date" ref={wrap}>
        <span className="ms-input-wrap">
          <TextInput
            id={id}
            value={text}
            invalid={tone === 'error' && !!message}
            aria-describedby={describedBy(id, !!hint, !!message)}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              if (!text.trim()) return onChange(null)
              const parsed = parseDate(text)
              onChange(parsed)
              if (!parsed) setText(text)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && e.altKey) setOpen(true)
            }}
          />
          {inline ? null : (
            <span className="ms-input-wrap__end">
              <IconButton
                label={open ? 'Close the calendar' : 'Open the calendar'}
                icon={<CalendarIcon />}
                aria-expanded={open}
                aria-controls={gridId}
                onClick={() => setOpen((o) => !o)}
              />
            </span>
          )}
        </span>
        {open ? picker : null}
      </div>
    </Field>
  )
}
