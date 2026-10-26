/**
 * Form components (COMPONENTS.md, Specs — forms). Every control sits in a Field that owns the label, hint, error and
 * the async-check line. Validation runs on blur after the first edit and on submit (INTERACTION.md, Forms).
 */
import { useEffect, useId, useRef, useState, type ChangeEvent, type JSX, type ReactNode } from 'react'
import { Spinner } from '../feedback'
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ErrorIcon,
  EyeIcon,
  EyeOffIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  WarningIcon,
} from '../feedback/icons'
import './vc.css'

export type LineTone = 'error' | 'warning' | 'success' | 'pending'

/* Field ----------------------------------------------------------------------------------------------------------- */
export interface FieldProps {
  label: string
  hint?: string
  optional?: boolean
  error?: string
  warning?: string
  success?: string
  pending?: string
  /** Render the control with the ids it must carry. */
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  after?: ReactNode
}

export function Field({ label, hint, optional, error, warning, success, pending, children, after, fieldId }: FieldProps & { fieldId?: string }): JSX.Element {
  const generated = useId()
  const id = fieldId ?? generated
  const hintId = `${id}-hint`
  const lineId = `${id}-line`
  const line = error ? { tone: 'error' as const, text: error } : pending ? { tone: 'pending' as const, text: pending } : warning ? { tone: 'warning' as const, text: warning } : success ? { tone: 'success' as const, text: success } : null
  const describedBy = [line ? lineId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="vc-field">
      <label htmlFor={id} className="vc-field__label">
        {label} {optional ? <span className="vc-field__optional">(optional)</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {line ? <FieldLine id={lineId} tone={line.tone} text={line.text} /> : null}
      {hint ? (
        <p id={hintId} className="vc-field__hint">
          {hint}
        </p>
      ) : null}
      {after}
    </div>
  )
}

export function FieldLine({ id, tone, text }: { id?: string; tone: LineTone; text: string }): JSX.Element {
  return (
    <p id={id} className="vc-field__line" data-tone={tone}>
      <span className="vc-icon" aria-hidden="true">
        {tone === 'error' ? <ErrorIcon /> : tone === 'warning' ? <WarningIcon /> : tone === 'success' ? <CheckIcon /> : <Spinner size="sm" />}
      </span>
      {text}
    </p>
  )
}

/* Text input ------------------------------------------------------------------------------------------------------ */
export interface TextInputProps extends Omit<FieldProps, 'children'> {
  fieldId?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: 'text' | 'email' | 'search' | 'password'
  inputMode?: 'text' | 'decimal' | 'numeric' | 'email'
  autoComplete?: string
  placeholder?: string
  prefix?: string
  suffix?: ReactNode
  readOnly?: boolean
  disabled?: boolean
  className?: string
}

export function TextInput({ value, onChange, onBlur, type = 'text', inputMode, autoComplete, placeholder, prefix, suffix, readOnly, disabled, className, ...field }: TextInputProps): JSX.Element {
  return (
    <Field {...field}>
      {({ id, describedBy, invalid }) => (
        <div className={`vc-input vc-cut ${className ?? ''}`} data-invalid={invalid} data-readonly={readOnly || undefined} data-disabled={disabled || undefined}>
          {prefix ? <span className="vc-input__affix" aria-hidden="true">{prefix}</span> : null}
          <input
            id={id}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            value={value}
            readOnly={readOnly}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
          {suffix}
        </div>
      )}
    </Field>
  )
}

/* Search input ---------------------------------------------------------------------------------------------------- */
export function SearchInput({ value, onChange, busy, label = 'Search games and battle passes', onSubmit, shortcut = true }: { value: string; onChange: (value: string) => void; busy?: boolean; label?: string; onSubmit?: () => void; shortcut?: boolean }): JSX.Element {
  const id = useId()
  const ref = useRef<HTMLInputElement>(null)
  return (
    <form
      role="search"
      aria-label={label}
      className="vc-input vc-cut"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      <label htmlFor={id} className="vc-sr">
        {label}
      </label>
      <span className="vc-icon" aria-hidden="true">
        {busy ? <Spinner size="md" /> : <SearchIcon />}
      </span>
      <input
        ref={ref}
        id={id}
        type="search"
        placeholder="Search games"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onChange('')
          }
        }}
      />
      {value ? (
        <button type="button" className="vc-input__btn" aria-label="Clear search" onClick={() => { onChange(''); ref.current?.focus() }}>
          <CloseIcon />
        </button>
      ) : shortcut ? (
        <kbd className="vc-kbd vc-hide-phone" aria-hidden="true">
          /
        </kbd>
      ) : null}
    </form>
  )
}

/* Textarea with count --------------------------------------------------------------------------------------------- */
export function TextArea({ value, onChange, limit, ...field }: Omit<FieldProps, 'children'> & { value: string; onChange: (v: string) => void; limit: number }): JSX.Element {
  const left = limit - value.length
  const tone = left < 0 ? 'error' : left <= limit * 0.1 ? 'warning' : undefined
  const countText = left < 0 ? `${-left} over` : `${left} characters left`
  return (
    <Field {...field} error={left < 0 ? `Gift notes can be up to ${limit} characters. ${-left} over.` : field.error}>
      {({ id, describedBy, invalid }) => (
        <>
          <div className="vc-input vc-cut" data-invalid={invalid}>
            <textarea id={id} value={value} aria-invalid={invalid || undefined} aria-describedby={`${describedBy ?? ''} ${id}-count`} onChange={(event) => onChange(event.target.value)} />
          </div>
          <span id={`${id}-count`} className="vc-count" data-tone={tone}>
            {countText}
          </span>
        </>
      )}
    </Field>
  )
}

/* Password with show toggle --------------------------------------------------------------------------------------- */
export function PasswordInput({ value, onChange, isNew, ...field }: Omit<FieldProps, 'children'> & { value: string; onChange: (v: string) => void; isNew?: boolean }): JSX.Element {
  const [shown, setShown] = useState(false)
  const [caps, setCaps] = useState(false)
  return (
    <Field {...field} warning={caps ? 'Caps Lock is on' : field.warning}>
      {({ id, describedBy, invalid }) => (
        <div className="vc-input vc-cut" data-invalid={invalid}>
          <input
            id={id}
            type={shown ? 'text' : 'password'}
            autoComplete={isNew ? 'new-password' : 'current-password'}
            value={value}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
            onKeyUp={(event) => setCaps(event.getModifierState('CapsLock'))}
          />
          <button type="button" className="vc-input__btn" aria-pressed={shown} aria-label={shown ? 'Hide password' : 'Show password'} onClick={() => setShown((v) => !v)}>
            {shown ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      )}
    </Field>
  )
}

/* Code input: one input, grouped visually; paste in any format ---------------------------------------------------- */
export function formatKey(raw: string, numeric = false): string {
  if (numeric) return raw.replace(/\D/g, '').slice(0, 6)
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 25)
  return clean.match(/.{1,5}/g)?.join('-') ?? ''
}

export function CodeInput({ value, onChange, numeric, ...field }: Omit<FieldProps, 'children'> & { value: string; onChange: (v: string) => void; numeric?: boolean }): JSX.Element {
  return (
    <Field {...field}>
      {({ id, describedBy, invalid }) => (
        <div className="vc-input vc-cut vc-code-input" data-invalid={invalid}>
          <input
            id={id}
            value={value}
            inputMode={numeric ? 'numeric' : 'text'}
            autoComplete={numeric ? 'one-time-code' : 'off'}
            spellCheck={false}
            placeholder={numeric ? '000000' : 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(formatKey(event.target.value, numeric))}
          />
        </div>
      )}
    </Field>
  )
}

/* Native select: kept for plain forms where the platform picker is wanted; the designed one is `Select` (listbox.tsx). */
export function NativeSelect<T extends string>({ value, onChange, options, ...field }: Omit<FieldProps, 'children'> & { value: T; onChange: (v: T) => void; options: readonly { id: T; label: string }[] }): JSX.Element {
  return (
    <Field {...field}>
      {({ id, describedBy, invalid }) => (
        <div className="vc-input vc-cut vc-native-select" data-invalid={invalid}>
          <select id={id} value={value} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value as T)}>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </Field>
  )
}

/* Checkbox and radio ---------------------------------------------------------------------------------------------- */
export function Checkbox({ label, checked, indeterminate, onChange, count, disabled, description }: { label: string; checked: boolean; indeterminate?: boolean; onChange: (v: boolean) => void; count?: number; disabled?: boolean; description?: string }): JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return (
    <label className="vc-check">
      <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span>
        {label}
        {description ? <span className="vc-check__desc">{description}</span> : null}
      </span>
      {count !== undefined ? <span className="vc-check__count">{count}</span> : null}
    </label>
  )
}

export function RadioGroup<T extends string>({ legend, name, value, onChange, options, error }: { legend: string; name: string; value: T; onChange: (v: T) => void; options: readonly { id: T; label: string; description?: string; disabled?: boolean }[]; error?: string }): JSX.Element {
  const errorId = useId()
  return (
    <fieldset className="vc-fieldset vc-fieldset--compact" aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}>
      <legend>{legend}</legend>
      {error ? <FieldLine id={errorId} tone="error" text={error} /> : null}
      {options.map((option) => (
        <label key={option.id} className="vc-check">
          <input type="radio" name={name} value={option.id} checked={value === option.id} disabled={option.disabled} onChange={() => onChange(option.id)} />
          <span>
            {option.label}
            {option.description ? <span className="vc-check__desc">{option.description}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export function Fieldset({ legend, children, error }: { legend: string; children: ReactNode; error?: string }): JSX.Element {
  const errorId = useId()
  return (
    <fieldset className="vc-fieldset" aria-describedby={error ? errorId : undefined}>
      <legend>{legend}</legend>
      {error ? <FieldLine id={errorId} tone="error" text={error} /> : null}
      {children}
    </fieldset>
  )
}

/* Switch: saves itself, optimistic, rolls back on failure --------------------------------------------------------- */
export function Switch({ label, checked: initial, onSave, disabledReason }: { label: string; checked: boolean; onSave: (next: boolean) => Promise<unknown>; disabledReason?: string }): JSX.Element {
  const [checked, setChecked] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [showSpinner, setShowSpinner] = useState(false)
  const lineId = useId()
  const labelId = useId()
  useEffect(() => setChecked(initial), [initial])
  async function toggle(next = !checked): Promise<void> {
    if (disabledReason) return
    const previous = checked
    setChecked(next)
    setStatus('saving')
    const spin = window.setTimeout(() => setShowSpinner(true), 400)
    try {
      await onSave(next)
      setStatus('saved')
    } catch {
      setChecked(previous)
      setStatus('failed')
    } finally {
      window.clearTimeout(spin)
      setShowSpinner(false)
    }
  }
  return (
    <div className="vc-stack">
      <div className="vc-switch-row">
        <button type="button" role="switch" aria-checked={checked} aria-labelledby={labelId} aria-disabled={disabledReason ? true : undefined} aria-busy={status === 'saving' || undefined} aria-describedby={lineId} className="vc-switch" onClick={() => void toggle()}>
          <span className="vc-switch__track vc-cut" aria-hidden="true">
            <span className="vc-switch__thumb" />
          </span>
          <span className="vc-switch__word" aria-hidden="true">
            {checked ? 'On' : 'Off'}
          </span>
        </button>
        {/* The label sits outside the button so it may wrap; a click on it toggles too. */}
        <span id={labelId} className="vc-switch__label" onClick={() => void toggle()}>
          {label}
        </span>
      </div>
      <span id={lineId} role="status">
        {disabledReason ? <span className="vc-field__hint">{disabledReason}</span> : null}
        {status === 'saving' && showSpinner ? <FieldLine tone="pending" text="Saving…" /> : null}
        {status === 'saved' ? <span className="vc-field__hint">Saved</span> : null}
        {status === 'failed' ? (
          <span className="vc-row">
            <FieldLine tone="error" text="Not saved." />
            <button type="button" className="vc-link" onClick={() => void toggle(!checked)}>
              Try again
            </button>
          </span>
        ) : null}
      </span>
    </div>
  )
}

/* Range slider with number inputs (the click and keyboard alternative to dragging) -------------------------------- */
export function RangeSlider({ legend, min, max, low, high, onChange, unit = '$' }: { legend: string; min: number; max: number; low: number; high: number; onChange: (low: number, high: number) => void; unit?: string }): JSX.Element {
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const fillStyle = { insetInlineStart: `${pct(low)}%`, insetInlineEnd: `${100 - pct(high)}%` }
  return (
    <fieldset className="vc-fieldset vc-fieldset--compact">
      <legend>{legend}</legend>
      <div className="vc-slider">
        <div className="vc-slider__track">
          <span className="vc-slider__rail" aria-hidden="true" />
          <span className="vc-slider__fill" aria-hidden="true" style={fillStyle} />
          <input type="range" min={min} max={max} value={low} aria-label="Minimum price" aria-valuetext={`${unit}${low}`} onChange={(event) => onChange(Math.min(Number(event.target.value), high), high)} />
          <input type="range" min={min} max={max} value={high} aria-label="Maximum price" aria-valuetext={`${unit}${high}`} onChange={(event) => onChange(low, Math.max(Number(event.target.value), low))} />
        </div>
        <div className="vc-slider__inputs">
          <TextInput label="Min" prefix={unit} inputMode="decimal" value={String(low)} onChange={(v) => onChange(Math.min(Math.max(min, Number(v) || min), high), high)} />
          <TextInput label="Max" prefix={unit} inputMode="decimal" value={String(high)} onChange={(v) => onChange(low, Math.max(Math.min(max, Number(v) || max), low))} />
        </div>
      </div>
    </fieldset>
  )
}

/* Quantity stepper: minus turns into remove at 1 ------------------------------------------------------------------- */
export function QuantityStepper({ game, value, onChange, onRemove, max = 5 }: { game: string; value: number; onChange: (v: number) => void; onRemove: () => void; max?: number }): JSX.Element {
  const atMax = value >= max
  return (
    <div className="vc-stack">
      <div role="group" aria-label={`Quantity, ${game}`} className="vc-stepper vc-cut">
        {value <= 1 ? (
          <button type="button" aria-label={`Remove ${game} from cart`} onClick={onRemove}>
            <TrashIcon />
          </button>
        ) : (
          <button type="button" aria-label="Decrease" onClick={() => onChange(value - 1)}>
            <MinusIcon />
          </button>
        )}
        <input aria-label="Quantity" inputMode="numeric" value={value} onChange={(event) => onChange(Math.min(max, Math.max(1, Number(event.target.value) || 1)))} />
        <button type="button" aria-label="Increase" data-autorun-target aria-disabled={atMax || undefined} onClick={() => !atMax && onChange(value + 1)}>
          <PlusIcon />
        </button>
      </div>
      {atMax ? <span className="vc-field__hint">Up to {max} per order</span> : null}
    </div>
  )
}

/* Date input with a designed picker ------------------------------------------------------------------------------- */
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function DateInput({ label, value, onChange, error, today = '2026-10-23' }: { label: string; value: string; onChange: (v: string) => void; error?: string; today?: string }): JSX.Element {
  const [open, setOpen] = useState(false)
  const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(`${today}T00:00:00`)
  const [month, setMonth] = useState(new Date(base.getFullYear(), base.getMonth(), 1))
  const calId = useId()
  const lead = (month.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: lead + days }, (_, i) => (i < lead ? null : new Date(month.getFullYear(), month.getMonth(), i - lead + 1)))
  return (
    <TextInput
      label={label}
      hint="YYYY-MM-DD"
      error={error}
      value={value}
      inputMode="numeric"
      onChange={onChange}
      suffix={
        <span className="vc-anchor">
          <button type="button" className="vc-input__btn" aria-label={`Choose ${label.toLowerCase()} date`} aria-expanded={open} aria-controls={calId} onClick={() => setOpen((v) => !v)}>
            <CalendarIcon />
          </button>
          {open ? (
            <div
              id={calId}
              role="dialog"
              aria-label={`${label} date`}
              className="vc-popover vc-cut vc-cut--card vc-calendar"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpen(false)
              }}
            >
              <div className="vc-row">
                <button type="button" className="vc-input__btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <ChevronLeftIcon />
                </button>
                <strong className="vc-num" aria-live="polite">
                  {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </strong>
                <button type="button" className="vc-input__btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <ChevronRightIcon />
                </button>
              </div>
              <div className="vc-calendar__grid">
                {DOW.map((d) => (
                  <span key={d} className="vc-calendar__dow" aria-hidden="true">
                    {d}
                  </span>
                ))}
                {cells.map((date, i) =>
                  date ? (
                    <button
                      key={i}
                      type="button"
                      className="vc-calendar__day"
                      data-today={iso(date) === today}
                      aria-pressed={iso(date) === value}
                      disabled={iso(date) > today}
                      aria-label={date.toLocaleDateString('en-US', { dateStyle: 'full' }) + (iso(date) === today ? ', today' : '')}
                      onClick={() => {
                        onChange(iso(date))
                        setOpen(false)
                      }}
                    >
                      {date.getDate()}
                    </button>
                  ) : (
                    <span key={i} />
                  ),
                )}
              </div>
            </div>
          ) : null}
        </span>
      }
    />
  )
}

/* Error summary: focus moves here on a failed submit; each line links to its field -------------------------------- */
export function ErrorSummary({ errors, headingLevel = 3, focusOnShow = true }: { errors: readonly { fieldId: string; text: string }[]; headingLevel?: 2 | 3; focusOnShow?: boolean }): JSX.Element | null {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (errors.length && focusOnShow) ref.current?.focus()
  }, [errors, focusOnShow])
  if (!errors.length) return null
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  return (
    <div ref={ref} tabIndex={-1} className="vc-summary-errors vc-cut">
      <Heading>
        <span className="vc-icon" aria-hidden="true">
          <ErrorIcon />
        </span>
        Fix {errors.length} {errors.length === 1 ? 'thing' : 'things'} to continue
      </Heading>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => {
                event.preventDefault()
                document.getElementById(error.fieldId)?.focus()
              }}
            >
              {error.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
