/**
 * Kitty's form controls (COMPONENTS.md: Field, Text input, Amount input, Textarea, Code input, Select, Combobox,
 * Checkbox, Radio group, Switch, Slider, Segmented control, Date input, Fieldset, Error summary, File input).
 * Validation timing and focus rules: INTERACTION.md, Forms. Words: CONTENT.md.
 */
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, ImageUp, Minus, Search, TriangleAlert, X } from 'lucide-react'
import { Spinner } from '../feedback'
import { Avatar, Icon } from './core'
import type { Person } from './sample'

type FieldTone = 'negative' | 'warning' | 'positive'

export interface FieldMessage {
  tone: FieldTone
  text: string
}

export interface FieldProps {
  label: string
  /** The id of the control; the label points at it. */
  id: string
  hint?: ReactNode
  optional?: boolean
  message?: FieldMessage | null
  counter?: { text: string; tone?: 'warning' | 'negative' }
  pending?: boolean
  hiddenLabel?: boolean
  children: (describedBy: string | undefined) => ReactNode
}

const MESSAGE_ICON = { negative: CircleAlert, warning: TriangleAlert, positive: CircleCheck } as const

/** Label above, hint, the control, the message under it. The control receives the describedby ids. */
export function Field({ label, id, hint, optional, message, counter, pending, hiddenLabel, children }: FieldProps): JSX.Element {
  const hintId = `${id}-hint`
  const messageId = `${id}-message`
  const describedBy = [hint ? hintId : null, message ? messageId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="k-field">
      <div className="k-field__head">
        <label htmlFor={id} className={hiddenLabel ? 'k-sr' : 'k-field__label'}>
          {label}
          {optional ? <span className="k-field__optional"> (optional)</span> : null}
        </label>
        {counter ? (
          <span className="k-field__counter" data-tone={counter.tone} aria-hidden="true">
            {counter.text}
          </span>
        ) : pending ? (
          <Spinner size="sm" label="Checking" />
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="k-field__hint">
          {hint}
        </p>
      ) : null}
      {children(describedBy)}
      {message ? (
        <p id={messageId} className="k-field__msg" data-tone={message.tone}>
          <Icon icon={MESSAGE_ICON[message.tone]} size="sm" />
          <span>
            {message.tone === 'negative' ? <span className="k-sr">Error: </span> : null}
            {message.text}
          </span>
        </p>
      ) : null}
    </div>
  )
}

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean
  preview?: 'hover' | 'focus'
  search?: boolean
  onClear?: () => void
  trailing?: ReactNode
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, preview, search, onClear, trailing, readOnly, disabled, ...rest },
  ref,
) {
  return (
    <div className="k-input" data-invalid={invalid || undefined} data-preview={preview} data-readonly={readOnly || undefined} data-disabled={disabled || undefined}>
      {search ? <Search className="k-icon k-input__icon" data-size="sm" aria-hidden="true" /> : null}
      <input
        ref={ref}
        {...rest}
        type={search ? 'search' : rest.type}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onKeyDown={(event) => {
          if (search && event.key === 'Escape' && onClear) onClear()
          rest.onKeyDown?.(event)
        }}
      />
      {search && onClear && rest.value ? (
        <button type="button" className="k-iconbtn k-iconbtn--inset" aria-label="Clear search" onClick={onClear}>
          <X className="k-icon" data-size="sm" aria-hidden="true" />
        </button>
      ) : null}
      {trailing}
    </div>
  )
})

/** Parse what people type for money: "20", "20.5", "£1,200", "1200.00". Returns pence, or null if it is not money. */
export function parseAmount(text: string): number | null {
  const clean = text.replace(/[£,\s]/g, '')
  if (!clean) return null
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return Number.NaN
  return Math.round(Number(clean) * 100)
}

export interface AmountInputProps {
  id: string
  value: string
  onChange: (text: string) => void
  invalid?: boolean
  size?: 'md' | 'lg'
  describedBy?: string
  readOnly?: boolean
  label?: string
}

/** Money someone types: "£" prefix, decimal keypad, letters never appear, formatted on blur. */
export function AmountInput({ id, value, onChange, invalid, size = 'md', describedBy, readOnly, label }: AmountInputProps): JSX.Element {
  return (
    <div className="k-input" data-size={size === 'lg' ? 'lg' : undefined} data-invalid={invalid || undefined} data-readonly={readOnly || undefined}>
      <span className="k-input__prefix" aria-hidden="true">
        £
      </span>
      <input
        id={id}
        data-amount
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={value}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.,£]/g, ''))}
        onBlur={() => {
          const pence = parseAmount(value)
          if (pence !== null && !Number.isNaN(pence)) onChange((pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
        }}
      />
    </div>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function Textarea({ invalid, ...rest }: TextareaProps): JSX.Element {
  return (
    <div className="k-input" data-invalid={invalid || undefined}>
      <textarea {...rest} aria-invalid={invalid || undefined} />
    </div>
  )
}

/** "42 of 140" with the warning at 20 left and the error past the limit (CONTENT.md, textarea.counter). */
export function counterFor(length: number, max: number): { text: string; tone?: 'warning' | 'negative' } {
  return { text: `${length} of ${max}`, tone: length > max ? 'negative' : max - length <= 20 ? 'warning' : undefined }
}

export interface CodeInputProps {
  id: string
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  invalid?: boolean
  busy?: boolean
  locked?: boolean
  describedBy?: string
  autoFocus?: boolean
  /** The name when no <label for> points at it. */
  label?: string
  /** Pin the focused look (the /system page shows "filling" at rest). */
  previewFocus?: boolean
}

/** One real input under six drawn boxes, so screen readers hear one field and paste works anywhere. */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(function CodeInput(
  { id, length = 6, value, onChange, onComplete, invalid, busy, locked, describedBy, autoFocus, label, previewFocus },
  ref,
) {
  const [hasFocus, setFocused] = useState(false)
  const focused = hasFocus || !!previewFocus
  return (
    <div className="k-stack">
    <div className="k-code" data-invalid={invalid || undefined} data-busy={busy || undefined} data-locked={locked || undefined}>
      <input
        ref={ref}
        id={id}
        className="k-code__input"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        autoFocus={autoFocus}
        readOnly={busy || locked}
        aria-disabled={locked || undefined}
        aria-busy={busy || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '').slice(0, length)
          onChange(digits)
          if (digits.length === length) onComplete?.(digits)
        }}
      />
      {Array.from({ length }, (_, i) => (
        <span key={i} className="k-code__box" aria-hidden="true" data-current={focused && !busy && i === Math.min(value.length, length - 1) ? true : undefined}>
          {i < value.length ? <span className="k-code__dot" /> : null}
        </span>
      ))}
    </div>
    {busy ? (
      <p className="k-field__msg k-muted" aria-hidden="true">
        <Spinner size="sm" /> Checking…
      </p>
    ) : null}
    </div>
  )
})

export interface Option {
  id: string
  label: string
  hint?: string
  person?: Person
}

export interface SelectProps {
  id: string
  options: readonly Option[]
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
  invalid?: boolean
  describedBy?: string
  loading?: boolean
  emptyText?: string
  /** Render the list open (the /system page shows it at rest). */
  defaultOpen?: boolean
  /** The name when no <label for> points at it. */
  label?: string
}

/** Select-only combobox (APG): ↑/↓, Home/End, type-ahead, Enter or Space to choose, Esc to close. */
export function Select({ id, options, value, onChange, placeholder = 'Choose', invalid, describedBy, loading, emptyText, defaultOpen = false, label }: SelectProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.id === value)))
  const listId = `${id}-list`
  const trigger = useRef<HTMLButtonElement>(null)
  const selected = options.find((o) => o.id === value)

  function choose(index: number): void {
    const option = options[index]
    if (!option) return
    onChange(option.id)
    setOpen(false)
    trigger.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (event.key === 'ArrowDown') setActive((i) => Math.min(options.length - 1, i + 1))
    else if (event.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1))
    else if (event.key === 'Home') setActive(0)
    else if (event.key === 'End') setActive(options.length - 1)
    else if (event.key === 'Enter' || event.key === ' ') choose(active)
    else if (event.key === 'Escape' || event.key === 'Tab') setOpen(false)
    else if (event.key.length === 1) {
      const next = options.findIndex((o) => o.label.toLowerCase().startsWith(event.key.toLowerCase()))
      if (next >= 0) setActive(next)
    } else return
    if (event.key !== 'Tab') event.preventDefault()
  }

  return (
    <div className="k-pop-anchor" style={{ inlineSize: '100%' }}>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        className="k-input k-select-trigger"
        data-invalid={invalid || undefined}
        data-placeholder={selected ? undefined : true}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && !loading && options[active] ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) setOpen(false)
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown className="k-icon" data-size="sm" aria-hidden="true" />
      </button>
      {open ? (
        <ul id={listId} role="listbox" className="k-pop" data-static={defaultOpen || undefined} style={{ inlineSize: '100%', listStyle: 'none', margin: 0, marginBlockStart: defaultOpen ? 'var(--space-1)' : 0 }} aria-busy={loading || undefined} tabIndex={-1}>
          {loading ? (
            <li className="k-option" role="option" aria-selected={false} aria-disabled="true">
              <Spinner size="sm" /> Loading categories
            </li>
          ) : options.length === 0 ? (
            <li className="k-option k-muted" role="option" aria-selected={false} aria-disabled="true">
              {emptyText ?? 'Nothing to choose yet'}
            </li>
          ) : (
            options.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                className="k-option"
                aria-selected={option.id === value}
                data-active={index === active ? true : undefined}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                {option.label}
                {option.id === value ? <Check className="k-icon k-option__check" data-size="sm" aria-hidden="true" /> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}

export interface ComboboxProps {
  id: string
  options: readonly Option[]
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  invalid?: boolean
  describedBy?: string
  onInvite?: (name: string) => void
  /** Pinned states for the /system page: start with this text typed and the list open (in the flow). */
  initialText?: string
  defaultOpen?: boolean
}

/** Combobox with a listbox popup (APG): type to filter people, ↑/↓, Enter to choose, Esc clears the list then the text. */
export function Combobox({ id, options, value, onChange, placeholder = 'Search family', invalid, describedBy, onInvite, initialText, defaultOpen = false }: ComboboxProps): JSX.Element {
  const selected = options.find((o) => o.id === value)
  const [text, setText] = useState(initialText ?? selected?.label ?? '')
  const [open, setOpen] = useState(defaultOpen)
  const [active, setActive] = useState(0)
  const listId = `${id}-list`
  const matches = options.filter((o) => o.label.toLowerCase().includes(text.trim().toLowerCase()))

  useEffect(() => {
    if (selected) setText(selected.label)
  }, [selected])

  function choose(option: Option): void {
    onChange(option.id)
    setText(option.label)
    setOpen(false)
  }

  return (
    <div className="k-pop-anchor" style={{ inlineSize: '100%' }}>
      <div className="k-input" data-invalid={invalid || undefined}>
        {selected ? selected.person ? <Avatar person={selected.person} size={24} decorative /> : null : <Search className="k-icon k-input__icon" data-size="sm" aria-hidden="true" />}
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setActive(0)
            setOpen(true)
            if (value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => !defaultOpen && setOpen(false), 0)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
              setActive((i) => Math.min(matches.length - 1, i + 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((i) => Math.max(0, i - 1))
            } else if (event.key === 'Enter' && open && matches[active]) {
              event.preventDefault()
              choose(matches[active])
            } else if (event.key === 'Escape') {
              if (open) setOpen(false)
              else {
                setText('')
                onChange(null)
              }
            }
          }}
        />
        <ChevronDown className="k-icon k-input__icon" data-size="sm" aria-hidden="true" />
      </div>
      {open && !matches.length ? (
        // No matches: a plain panel, not a listbox, so the Invite button is not nested inside an option
        <div id={listId} className="k-pop k-row" data-static={defaultOpen || undefined} role="status" style={{ inlineSize: '100%', margin: 0, marginBlockStart: defaultOpen ? 'var(--space-1)' : 0, padding: 'var(--space-2) var(--space-3)', flexWrap: 'nowrap' }}>
          <span className="k-muted">No one called “{text}”</span>
          {onInvite ? (
            <button type="button" className="k-btn" data-variant="quiet" data-size="sm" style={{ marginInlineStart: 'auto' }} onPointerDown={(event) => event.preventDefault()} onClick={() => onInvite(text)}>
              Invite {text}
            </button>
          ) : null}
        </div>
      ) : open ? (
        <ul id={listId} role="listbox" className="k-pop" data-static={defaultOpen || undefined} style={{ inlineSize: '100%', listStyle: 'none', margin: 0, marginBlockStart: defaultOpen ? 'var(--space-1)' : 0 }}>
          {matches.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${index}`}
                role="option"
                className="k-option"
                aria-selected={option.id === value}
                data-active={index === active ? true : undefined}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                {option.person ? <Avatar person={option.person} size={24} decorative /> : null}
                {option.label}
                {option.hint ? <span className="k-option__hint">{option.hint}</span> : null}
              </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hint?: string
  indeterminate?: boolean
}

export function Checkbox({ label, hint, indeterminate, disabled, ...rest }: CheckboxProps): JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  const hintId = useId()
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])
  return (
    <label className="k-check" data-disabled={disabled || undefined}>
      <span className="k-check__box">
        <input ref={ref} type="checkbox" disabled={disabled} aria-describedby={hint ? hintId : undefined} {...rest} />
        <Check className="k-check__mark" data-kind="check" aria-hidden="true" />
        <Minus className="k-check__mark" data-kind="dash" aria-hidden="true" style={{ position: 'absolute' }} />
      </span>
      <span className="k-check__text">
        <span>{label}</span>
        {hint ? (
          <span id={hintId} className="k-field__hint">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export interface RadioOption {
  id: string
  label: string
  hint?: string
  disabled?: boolean
  swatch?: 1 | 2 | 3 | 4 | 5
}

export function RadioGroup({ legend, name, options, value, onChange, inline, hiddenLegend }: { legend: string; name: string; options: readonly RadioOption[]; value: string; onChange: (id: string) => void; inline?: boolean; hiddenLegend?: boolean }): JSX.Element {
  return (
    <fieldset className="k-radio-group" data-inline={inline || undefined}>
      <legend className={hiddenLegend ? 'k-sr' : undefined}>{legend}</legend>
      {options.map((option) => (
        <label key={option.id} className="k-radio" data-disabled={option.disabled || undefined}>
          <span className="k-radio__dot">
            <input type="radio" name={name} value={option.id} checked={value === option.id} disabled={option.disabled} onChange={() => onChange(option.id)} />
          </span>
          {option.swatch ? <span className="k-radio__swatch" data-colour={option.swatch} aria-hidden="true" /> : null}
          <span className="k-check__text">
            <span>{option.label}</span>
            {option.hint ? <span className="k-field__hint">{option.hint}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export interface SwitchProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (next: boolean) => void
  pending?: boolean
  unavailableReason?: string
}

/** A setting that takes effect at once (optimistic, INTERACTION.md allow-list). */
export function Switch({ label, hint, checked, onChange, pending, unavailableReason }: SwitchProps): JSX.Element {
  const hintId = useId()
  return (
    <label className="k-switch" data-disabled={unavailableReason ? true : undefined}>
      <span className="k-check__text">
        <span className="k-switch__side">
          {label}
          {pending ? <Spinner size="sm" label="Saving" /> : null}
        </span>
        {hint || unavailableReason ? (
          <span id={hintId} className="k-field__hint">
            {unavailableReason ?? hint}
          </span>
        ) : null}
      </span>
      <span className="k-switch__track">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          aria-busy={pending || undefined}
          aria-disabled={unavailableReason ? true : undefined}
          aria-describedby={hint || unavailableReason ? hintId : undefined}
          onChange={(event) => {
            if (unavailableReason) return
            onChange(event.target.checked)
          }}
        />
        <span className="k-switch__thumb">
          <Check className="k-icon" aria-hidden="true" />
        </span>
      </span>
    </label>
  )
}

/** Always paired with an Amount input; the native range gives arrows, PgUp/PgDn, Home/End and track clicks. */
export function Slider({ id, label, min, max, step, value, onChange, marker }: { id: string; label: string; min: number; max: number; step: number; value: number; onChange: (pence: number) => void; marker?: string }): JSX.Element {
  return (
    <div className="k-slider">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={`£${(value / 100).toFixed(2)}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="k-slider__ends" aria-hidden="true">
        <span>£{min / 100}</span>
        {marker ? <span>{marker}</span> : null}
        <span>£{(max / 100).toLocaleString('en-GB')}</span>
      </div>
    </div>
  )
}

export interface SegmentOption {
  id: string
  label: string
  short?: string
  unavailable?: boolean
}

/** 2-4 views of the same data. Radio-group keys; the change applies at once. */
export function SegmentedControl({ label, options, value, onChange, block }: { label: string; options: readonly SegmentOption[]; value: string; onChange: (id: string) => void; block?: boolean }): JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  function move(from: number, delta: number): void {
    const n = options.length
    let i = from
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n
      if (!options[i].unavailable) break
    }
    onChange(options[i].id)
    refs.current[i]?.focus()
  }
  return (
    <div className="k-seg" role="radiogroup" aria-label={label} data-block={block || undefined}>
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={(el) => {
            refs.current[index] = el
          }}
          type="button"
          role="radio"
          className="k-seg__opt"
          aria-checked={option.id === value}
          aria-disabled={option.unavailable || undefined}
          tabIndex={option.id === value ? 0 : -1}
          onClick={() => !option.unavailable && onChange(option.id)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault()
              move(index, 1)
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault()
              move(index, -1)
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** "30 Oct 2026", "30/10/2026", "30 October 2026". */
export function parseDate(text: string): Date | null {
  const t = text.trim()
  const slash = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t)
  if (slash) return new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]))
  const words = /^(\d{1,2})\s+([a-z]{3})[a-z]*\s+(\d{4})$/i.exec(t)
  if (words) {
    const month = MONTHS.findIndex((m) => m.toLowerCase() === words[2].toLowerCase())
    if (month >= 0) return new Date(Number(words[3]), month, Number(words[1]))
  }
  return null
}

export interface DateInputProps {
  id: string
  value: string
  onChange: (text: string) => void
  invalid?: boolean
  describedBy?: string
  /** Days before this are unavailable (a payday cannot be in the past). */
  min?: Date
  defaultOpen?: boolean
}

/** The typed field always works; the calendar is a helper (APG date picker dialog pattern). */
export function DateInput({ id, value, onChange, invalid, describedBy, min, defaultOpen = false }: DateInputProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const chosen = parseDate(value)
  const [view, setView] = useState(() => chosen ?? min ?? new Date(2026, 9, 23))
  const [focusDay, setFocusDay] = useState(() => chosen ?? min ?? new Date(2026, 9, 23))
  const grid = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  // Focus moves into the grid only once the person has opened or used it, never on load (an open demo stays put).
  const touched = useRef(!defaultOpen)
  useEffect(() => {
    if (!open || !touched.current) return
    grid.current?.querySelector<HTMLButtonElement>('[data-focus]')?.focus()
  }, [open, focusDay])

  const first = new Date(view.getFullYear(), view.getMonth(), 1)
  const lead = (first.getDay() + 6) % 7
  const daysIn = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: lead + daysIn }, (_, i) => (i < lead ? null : new Date(view.getFullYear(), view.getMonth(), i - lead + 1)))
  const same = (a: Date | null, b: Date | null): boolean => !!a && !!b && a.toDateString() === b.toDateString()
  const blocked = (d: Date): boolean => !!min && d < new Date(min.getFullYear(), min.getMonth(), min.getDate())

  function shift(days: number): void {
    touched.current = true
    const next = new Date(focusDay)
    next.setDate(next.getDate() + days)
    setFocusDay(next)
    if (next.getMonth() !== view.getMonth()) setView(new Date(next.getFullYear(), next.getMonth(), 1))
  }

  return (
    <div className="k-pop-anchor" style={{ inlineSize: '100%' }}>
      <TextInput
        id={id}
        value={value}
        placeholder="30 Oct 2026"
        invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.altKey && event.key === 'ArrowDown') setOpen(true)
        }}
        trailing={
          <button ref={button} type="button" className="k-iconbtn k-iconbtn--inset" aria-label="Choose date" aria-expanded={open} onClick={() => { touched.current = true; setOpen((o) => !o) }}>
            <Calendar className="k-icon" data-size="sm" aria-hidden="true" />
          </button>
        }
      />
      {open ? (
        <div className="k-pop k-datepop" data-padded data-static={defaultOpen || undefined} role="dialog" aria-label={`Choose date, ${MONTHS[view.getMonth()]} ${view.getFullYear()}`} style={{ inlineSize: 'min(304px, 100%)', marginBlockStart: defaultOpen ? 'var(--space-1)' : 0 }}>
          <div className="k-card__head">
            <button type="button" className="k-iconbtn" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              <ChevronLeft className="k-icon" aria-hidden="true" />
            </button>
            <strong aria-live="polite">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </strong>
            <button type="button" className="k-iconbtn" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
              <ChevronRight className="k-icon" aria-hidden="true" />
            </button>
          </div>
          <div
            ref={grid}
            role="grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}
            onKeyDown={(event) => {
              const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, PageUp: -30, PageDown: 30 }
              if (event.key in keys) {
                event.preventDefault()
                shift(keys[event.key])
              } else if (event.key === 'Escape') {
                setOpen(false)
                button.current?.focus()
              }
            }}
          >
            <div role="row" style={{ display: 'contents' }}>
              {DAYS.map((d) => (
                <span key={d} role="columnheader" className="k-subtle" style={{ textAlign: 'center', fontSize: 'var(--step--2)' }}>
                  {d}
                </span>
              ))}
            </div>
            {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
              <div key={week} role="row" style={{ display: 'contents' }}>
                {cells.slice(week * 7, week * 7 + 7).map((d, i) =>
                  d ? (
                    <button
                      key={i}
                      type="button"
                      role="gridcell"
                      className="k-page-num"
                      aria-selected={same(d, chosen)}
                      aria-disabled={blocked(d) || undefined}
                      aria-label={`${DAYS[(d.getDay() + 6) % 7]} ${formatDate(d)}${blocked(d) ? ', unavailable' : ''}`}
                      tabIndex={same(d, focusDay) ? 0 : -1}
                      data-focus={same(d, focusDay) || undefined}
                      data-blocked={blocked(d) || undefined}
                      onClick={() => {
                        if (blocked(d)) return
                        onChange(formatDate(d))
                        setOpen(false)
                        button.current?.focus()
                      }}
                    >
                      {d.getDate()}
                    </button>
                  ) : (
                    <span key={i} role="gridcell" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function Fieldset({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }): JSX.Element {
  const hintId = useId()
  return (
    <fieldset className="k-fieldset" aria-describedby={hint ? hintId : undefined}>
      <legend>{legend}</legend>
      {hint ? (
        <p id={hintId} className="k-field__hint" style={{ marginBlockStart: 'calc(var(--space-3) * -1)' }}>
          {hint}
        </p>
      ) : null}
      {children}
    </fieldset>
  )
}

export interface SummaryError {
  fieldId: string
  text: string
}

/** Full-page forms with 3+ fields: "There is a problem", one link per error, focus moves here on submit. */
export const ErrorSummary = forwardRef<HTMLDivElement, { errors: readonly SummaryError[] }>(function ErrorSummary({ errors }, ref) {
  const headingId = useId()
  if (!errors.length) return null
  return (
    <div ref={ref} className="k-summary" tabIndex={-1} aria-labelledby={headingId}>
      <h3 id={headingId}>
        <CircleAlert className="k-icon" aria-hidden="true" />
        There is a problem
      </h3>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => {
                event.preventDefault()
                const field = document.getElementById(error.fieldId)
                field?.focus()
                field?.scrollIntoView({ block: 'center' })
              }}
            >
              {error.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
})

export interface FileInputProps {
  label: string
  hint: string
  accept: string
  maxBytes: number
  onFile: (file: File) => void
  error?: string | null
  /** Pin the drag-over look (the /system page). */
  previewOver?: boolean
}

/** The button always works; drag and drop is an extra on desktop. */
export function FileInput({ label, hint, accept, maxBytes, onFile, error, previewOver }: FileInputProps): JSX.Element {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setOver] = useState(false)
  const over = dragging || !!previewOver
  const [local, setLocal] = useState<string | null>(null)
  const hintId = useId()
  const pick = (file: File | undefined): void => {
    if (!file) return
    if (file.size > maxBytes) {
      setLocal('The photo must be 10 MB or smaller')
      return
    }
    setLocal(null)
    onFile(file)
  }
  const message = error ?? local
  return (
    <div
      className="k-drop"
      data-over={over || undefined}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        pick(event.dataTransfer.files[0])
      }}
    >
      <ImageUp className="k-icon k-muted" data-size="lg" aria-hidden="true" />
      {over ? (
        <span className="k-drop__over" aria-hidden="true">
          Drop the photo to add it
        </span>
      ) : null}
      <input ref={input} type="file" accept={accept} hidden aria-hidden="true" onChange={(event) => pick(event.target.files?.[0])} />
      <button type="button" className="k-btn" data-variant="secondary" aria-describedby={hintId} onClick={() => input.current?.click()}>
        {label}
      </button>
      <span id={hintId} className="k-field__hint">
        {hint}
      </span>
      {message ? (
        <p className="k-field__msg" data-tone="negative" role="alert">
          <CircleAlert className="k-icon" data-size="sm" aria-hidden="true" />
          {message}
        </p>
      ) : null}
    </div>
  )
}
