/**
 * The SIGNAL//CON controls (COMPONENTS.md): tabs, filter chips, the stock gauge, radio cards, the segmented picker,
 * the quantity stepper, the email field, the ticket stub, the accordion and the sheet. Styles in ui.css.
 */
import {
  type CSSProperties,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
} from 'react'
import { flip } from '../vfx'
import { IconCheck, IconClock, IconClose, IconMinus, IconPlus } from './icons'

const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ')

/* Tabs ---------------------------------------------------------------------------------------------------------- */
export interface TabItem {
  id: string
  label: ReactNode
  sub?: ReactNode
}

/**
 * ARIA tabs (arrows, Home, End). The panel flips like a channel change when the tab changes; `children` is the
 * current panel.
 */
export function Tabs({
  items,
  value,
  onChange,
  label,
  children,
}: {
  items: readonly TabItem[]
  value: string
  onChange: (id: string) => void
  label: string
  children: ReactNode
}): JSX.Element {
  const base = useId()
  const panel = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    void flip(panel.current)
  }, [value])
  const move = (e: KeyboardEvent<HTMLDivElement>): void => {
    const i = items.findIndex((t) => t.id === value)
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onChange(items[next].id)
    document.getElementById(`${base}-tab-${items[next].id}`)?.focus()
  }
  return (
    <div className="sc-tabs">
      <div role="tablist" aria-label={label} className="sc-tablist" onKeyDown={move}>
        {items.map((t) => {
          const on = t.id === value
          return (
            <button
              key={t.id}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              className="sc-tab sg-squash"
              onClick={() => onChange(t.id)}
            >
              {t.label}
              {t.sub && <span className="sc-tab-sub">{t.sub}</span>}
            </button>
          )
        })}
      </div>
      <div
        ref={panel}
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${value}`}
        className="sc-tabpanel"
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  )
}

/* Filter chips -------------------------------------------------------------------------------------------------- */
export interface ChipItem {
  id: string
  label: string
  icon?: ReactNode
}

/** Single-choice toggle buttons with a check as well as the fill. */
export function Chips({
  items,
  value,
  onChange,
  label,
}: {
  items: readonly ChipItem[]
  value: string
  onChange: (id: string) => void
  label: string
}): JSX.Element {
  return (
    <div role="group" aria-label={label} className="sc-chips">
      {items.map((c) => {
        const on = c.id === value
        return (
          <button key={c.id} type="button" aria-pressed={on} className="sc-chip sg-squash" onClick={() => onChange(c.id)}>
            {on ? <IconCheck size={16} /> : c.icon}
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

/* Stock gauge --------------------------------------------------------------------------------------------------- */
export type StockLevel = 'plenty' | 'fast' | 'out'
export function stockLevel(left: number, total: number): StockLevel {
  if (left <= 0) return 'out'
  if (left < 50 || left / total < 0.2) return 'fast'
  return 'plenty'
}

/** A four-bar signal meter plus the count in words. The bars never animate on load; a drop animates. */
export function StockGauge({
  left,
  total,
  compact = false,
  className,
}: {
  left: number
  total: number
  compact?: boolean
  className?: string
}): JSX.Element {
  const level = stockLevel(left, total)
  const lit = level === 'out' ? 0 : level === 'fast' ? (left / total < 0.05 ? 1 : 2) : left / total > 0.6 ? 4 : 3
  const text =
    level === 'out' ? 'Sold out' : level === 'fast' ? `Selling fast: ${left.toLocaleString('en')} left` : `${left.toLocaleString('en')} left`
  return (
    <span className={cx('sc-gauge', className)} data-level={level} data-compact={compact || undefined}>
      <span className="sc-gauge-bars sg-gauge" role="img" aria-label={`${lit} of 4 bars`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} data-off={i >= lit ? '' : undefined} />
        ))}
      </span>
      <span className="sc-gauge-text">{text}</span>
    </span>
  )
}

/* Radio cards --------------------------------------------------------------------------------------------------- */
export interface RadioCardItem {
  id: string
  disabled?: boolean
  disabledReason?: string
  featured?: boolean
}

/** A radiogroup of cards built on native radios (arrows move the choice). `render` draws a card's content. */
export function RadioCards<T extends RadioCardItem>({
  name,
  legend,
  items,
  value,
  onChange,
  render,
  className,
}: {
  name: string
  legend: ReactNode
  items: readonly T[]
  value: string
  onChange: (id: string) => void
  render: (item: T, selected: boolean) => ReactNode
  className?: string
}): JSX.Element {
  return (
    <fieldset className={cx('sc-radiocards', className)}>
      <legend className="sc-legend" tabIndex={-1}>
        {legend}
      </legend>
      <div className="sc-radiocards-row">
        {items.map((item) => {
          const on = item.id === value
          const reason = item.disabled ? `${name}-${item.id}-why` : undefined
          return (
            <label key={item.id} className="sc-radiocard sg-squash" data-selected={on || undefined} data-featured={item.featured || undefined} data-disabled={item.disabled || undefined}>
              <input
                type="radio"
                name={name}
                value={item.id}
                checked={on}
                aria-disabled={item.disabled || undefined}
                aria-describedby={reason}
                onChange={() => {
                  if (!item.disabled) onChange(item.id)
                }}
                className="sc-radio-input"
              />
              <span className="sc-radio-dot" aria-hidden />
              {render(item, on)}
              {item.disabled && item.disabledReason && (
                <span id={reason} className="sc-radiocard-why">
                  {item.disabledReason}
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/* Quantity stepper ---------------------------------------------------------------------------------------------- */
/** A whole number in [min, max] with − / + buttons; the typed value is kept and validated, never clamped silently. */
export function Stepper({
  label,
  hint,
  value,
  onChange,
  min = 1,
  max = 6,
  error,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  error?: string
}): JSX.Element {
  const id = useId()
  const n = Number.parseInt(value, 10)
  const atMin = !Number.isFinite(n) || n <= min
  const atMax = Number.isFinite(n) && n >= max
  const step = (d: number): void => {
    const base = Number.isFinite(n) ? n : min
    onChange(String(Math.min(max, Math.max(min, base + d))))
  }
  return (
    <div className="sc-stepper" data-invalid={error ? '' : undefined}>
      <label htmlFor={`${id}-input`} className="sc-field-label">
        {label}
      </label>
      <div className="sc-stepper-row">
        <button
          type="button"
          className="sc-round sg-squash"
          aria-label="One fewer pass"
          aria-disabled={atMin || undefined}
          aria-describedby={`${id}-hint`}
          onClick={() => !atMin && step(-1)}
        >
          <IconMinus />
        </button>
        <input
          id={`${id}-input`}
          className="sc-stepper-input"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint${error ? ` ${id}-err` : ''}`}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="sc-round sg-squash"
          aria-label="One more pass"
          aria-disabled={atMax || undefined}
          aria-describedby={`${id}-hint`}
          onClick={() => !atMax && step(1)}
        >
          <IconPlus />
        </button>
      </div>
      <p id={`${id}-hint`} className="sc-field-hint">
        {hint}
      </p>
      {error && (
        <p id={`${id}-err`} className="sc-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

/* Email field --------------------------------------------------------------------------------------------------- */
export function Field({
  label,
  hint,
  error,
  value,
  onChange,
  readOnly,
  inputRef,
}: {
  label: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  inputRef?: Ref<HTMLInputElement>
}): JSX.Element {
  const id = useId()
  const described = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className="sc-field" data-invalid={error ? '' : undefined}>
      <label htmlFor={id} className="sc-field-label">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        className="sc-input"
        type="email"
        autoComplete="email"
        spellCheck={false}
        value={value}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <p id={`${id}-hint`} className="sc-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="sc-field-error">
          {error}
        </p>
      )}
    </div>
  )
}

/* Ticket stub ---------------------------------------------------------------------------------------------------- */
/**
 * The result of a hold, in the hold button's place. A CRT band flips to "CH 04 · HELD", the stub ejects from the
 * slot under it carrying the visitor's own picks and a hold channel, and the hold time drains as the four-bar signal
 * gauge (one bar per quarter). The heading takes focus when it appears. Under reduced motion it simply appears.
 */
export function TicketStub({
  summary,
  days,
  code,
  secondsLeft,
  totalSeconds = 600,
  note,
  onRelease,
  onHoldAgain,
  headingRef,
}: {
  summary: string
  days?: string
  code?: string
  secondsLeft: number
  totalSeconds?: number
  note: string
  onRelease: () => void
  onHoldAgain: () => void
  headingRef?: Ref<HTMLHeadingElement>
}): JSX.Element {
  const band = useRef<HTMLDivElement>(null)
  const hid = useId()
  useEffect(() => {
    void flip(band.current)
  }, [])
  const expired = secondsLeft <= 0
  const soon = !expired && secondsLeft <= 60
  const mm = String(Math.floor(Math.max(0, secondsLeft) / 60)).padStart(2, '0') // taste-skill-ignore: a countdown clock
  const ss = String(Math.max(0, secondsLeft) % 60).padStart(2, '0') // taste-skill-ignore: a countdown clock
  const bars = expired ? 0 : Math.max(1, Math.ceil((secondsLeft / totalSeconds) * 4))
  return (
    <div className="sc-stub-wrap" data-expired={expired || undefined}>
      <div ref={band} className="sc-stub-band" aria-hidden>
        <span className="sc-stub-band-ch">
          <span className="sg-split">{expired ? 'CH 04 · OFF AIR' : 'CH 04 · HELD'}</span>
        </span>
        <span className="sc-gauge-bars sg-gauge" data-level={soon ? 'fast' : undefined}>
          {[0, 1, 2, 3].map((i) => (
            <i key={i} data-off={i >= bars ? '' : undefined} />
          ))}
        </span>
      </div>
      <div className="sc-stub-slot">
        <div className="sc-stub" data-band="paper" role="group" aria-labelledby={`${hid}-h`}>
          <span className="sc-stub-perf" aria-hidden />
          <div className="sc-stub-body">
            {expired ? (
              <>
                <h3 id={`${hid}-h`} ref={headingRef} tabIndex={-1} className="sc-stub-title">
                  Your hold ended
                </h3>
                <p className="sc-stub-note">The passes went back on sale.</p>
                <button type="button" className="sc-btn sg-squash" data-variant="primary" data-size="md" onClick={onHoldAgain}>
                  <span className="sc-btn-label">Hold again</span>
                </button>
              </>
            ) : (
              <>
                <span className="sc-tape" data-tone="night" style={{ rotate: '-3deg' } as CSSProperties}>
                  <IconCheck size={16} /> Held
                </span>
                <h3 id={`${hid}-h`} ref={headingRef} tabIndex={-1} className="sc-stub-title">
                  {summary}
                </h3>
                {(days || code) && (
                  <p className="sc-stub-meta">
                    {days && <span>{days}</span>}
                    {code && <span>Hold channel {code}</span>}
                  </p>
                )}
                <p className="sc-stub-timer" data-soon={soon || undefined}>
                  {soon && <IconClock size={16} />}
                  <span className="sc-mono">{`${mm}:${ss}`}</span> left{soon ? ' · Hold ends soon' : ''}
                </p>
                <p className="sc-stub-note">{note}</p>
                <button type="button" className="sc-link-btn" onClick={onRelease}>
                  Change passes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* Accordion ----------------------------------------------------------------------------------------------------- */
/** Native details/summary: works without JavaScript, several can be open. */
export function Accordion({ items }: { items: readonly { q: string; a: ReactNode }[] }): JSX.Element {
  return (
    <div className="sc-accordion">
      {items.map((it) => (
        <details key={it.q} className="sc-acc-item">
          <summary className="sc-acc-q">
            <span>{it.q}</span>
            <span className="sc-acc-glyph" aria-hidden>
              <IconPlus />
            </span>
          </summary>
          <div className="sc-acc-a">{it.a}</div>
        </details>
      ))}
    </div>
  )
}

/* Sheet --------------------------------------------------------------------------------------------------------- */
/**
 * A native modal dialog: a bottom sheet on phones, a centred panel from 768 px, or full screen (`full`). Esc, the
 * close button and a scrim click close it; focus goes to the heading and back to the opener. The heading and the
 * content exist only while it is open, so a closed sheet adds nothing to the heading outline.
 */
export function Sheet({
  open,
  onClose,
  title,
  titleHidden = false,
  full = false,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  titleHidden?: boolean
  full?: boolean
  children: ReactNode
}): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const opener = useRef<Element | null>(null)
  const id = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement
      d.showModal()
      requestAnimationFrame(() => heading.current?.focus())
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      className="sc-sheet"
      data-full={full || undefined}
      aria-labelledby={`${id}-t`}
      onClose={() => {
        onClose()
        ;(opener.current as HTMLElement | null)?.focus?.()
      }}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
    >
      {open && (
        <div className="sc-sheet-panel">
          <div className="sc-sheet-head">
            <h2 id={`${id}-t`} ref={heading} tabIndex={-1} className={titleHidden ? 'sr-only' : 'sc-sheet-title'}>
              {title}
            </h2>
            <button type="button" className="sc-round sg-squash" aria-label="Close" onClick={() => ref.current?.close()}>
              <IconClose />
            </button>
          </div>
          <div className="sc-sheet-body">{children}</div>
        </div>
      )}
    </dialog>
  )
}
