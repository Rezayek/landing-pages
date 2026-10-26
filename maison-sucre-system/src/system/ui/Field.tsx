import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type JSX,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { CheckIcon, ErrorIcon, MinusIcon, PlusIcon, SearchIcon, WarningIcon, CloseIcon } from '../feedback/icons'
import { cx } from '../feedback/internal'
import { Spinner } from '../feedback'
import { IconButton } from './Button'

export type FieldTone = 'error' | 'warning' | 'success'

export interface FieldProps {
  /** The control's id; the hint and message ids derive from it. */
  id: string
  label: string
  hint?: ReactNode
  /** The message under the control: an error, a soft warning, or a tick for a real check. */
  message?: string
  tone?: FieldTone
  optional?: boolean
  /** A fieldset for a group (time slots, chips): the label becomes its legend. */
  className?: string
  children: ReactNode
}

/** The ids a control reads to describe itself. */
export function describedBy(id: string, hasHint: boolean, hasMessage: boolean): string | undefined {
  return [hasHint ? `${id}-hint` : '', hasMessage ? `${id}-msg` : ''].filter(Boolean).join(' ') || undefined
}

/**
 * Label above, hint, the control, the message under it (COMPONENTS.md §Field). The error shows with its icon, its
 * words and the control's edge, never by colour alone; its ring is piped on after the text is there ('pipe',
 * MOTION-SYSTEM.md: input and validation). A visually hidden "Error:" starts the message for screen readers.
 */
export function Field({ id, label, hint, message, tone = 'error', optional, className, children }: FieldProps): JSX.Element {
  return (
    <div className={cx('ms-field', className)}>
      <label className="ms-field__label" htmlFor={id}>
        {label}
        {optional ? <span className="ms-field__optional"> (optional)</span> : null}
      </label>
      {hint ? (
        <span id={`${id}-hint`} className="ms-field__hint">
          {hint}
        </span>
      ) : null}
      {children}
      {message ? (
        <span id={`${id}-msg`} className="ms-field__msg" data-tone={tone}>
          <span data-vfx-play="pipe" style={{ display: 'inline-flex' }}>
            {tone === 'error' ? <ErrorIcon /> : tone === 'warning' ? <WarningIcon /> : <CheckIcon />}
          </span>
          <span>
            {tone === 'error' ? <span className="ms-sr">Error: </span> : null}
            {message}
          </span>
        </span>
      ) : null}
    </div>
  )
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
  /** An async check is running (postcode): the turntable shows at the end after 400 ms. */
  checking?: boolean
}

export function TextInput({ invalid, checking, className, ...rest }: TextInputProps): JSX.Element {
  const input = <input {...rest} className={cx('ms-input', className)} aria-invalid={invalid || undefined} aria-busy={checking || undefined} />
  if (!checking) return input
  return (
    <span className="ms-input-wrap">
      {input}
      <span className="ms-input-wrap__end">
        <Spinner size="sm" label="Checking" />
      </span>
    </span>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
  /** Show a count of `maxLength`; it turns to warning ink at 90 %. */
  countId?: string
}

export function Textarea({ invalid, countId, className, maxLength, value, ...rest }: TextareaProps): JSX.Element {
  const length = typeof value === 'string' ? value.length : 0
  return (
    <>
      <textarea {...rest} value={value} maxLength={maxLength} className={cx('ms-textarea', className)} aria-invalid={invalid || undefined} />
      {maxLength && countId ? (
        <span id={countId} className="ms-field__count" data-near={length >= maxLength * 0.9 || undefined}>
          {length.toLocaleString('en-GB')} of {maxLength.toLocaleString('en-GB')} characters
        </span>
      ) : null}
    </>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export function Select({ invalid, className, children, ...rest }: SelectProps): JSX.Element {
  return (
    <select {...rest} className={cx('ms-select', className)} aria-invalid={invalid || undefined}>
      {children}
    </select>
  )
}

export interface SearchFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  /** The count line under the field ("3 answers"). */
  count?: string
  controls?: string
}

/** Filters a list as you type (COMPONENTS.md §Search field). Esc clears. Focus stays in the field. */
export function SearchField({ id, label, value, onChange, count, controls }: SearchFieldProps): JSX.Element {
  return (
    <div className="ms-field">
      <label className="ms-field__label" htmlFor={id}>
        {label}
      </label>
      <span className="ms-input-wrap">
        <span className="ms-input-wrap__start" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={id}
          type="search"
          role="searchbox"
          className="ms-input"
          value={value}
          aria-controls={controls}
          aria-describedby={count ? `${id}-count` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onChange('')
          }}
        />
        {value ? (
          <span className="ms-input-wrap__end">
            <IconButton label="Clear search" icon={<CloseIcon />} onClick={() => onChange('')} />
          </span>
        ) : null}
      </span>
      {count ? (
        <span id={`${id}-count`} className="ms-field__hint">
          {count}
        </span>
      ) : null}
    </div>
  )
}

export interface NumberStepperProps {
  id: string
  value: number
  min: number
  max: number
  step?: number
  /** Page Up/Down moves by this. */
  bigStep?: number
  unit: string
  onChange: (value: number) => void
  /** Why the limit is the limit: shown on the button at the limit. */
  minReason?: string
  maxReason?: string
  invalid?: boolean
  describedBy?: string
}

/**
 * A small whole number with a range (COMPONENTS.md §Number stepper). Typing works, arrows step, Page Up/Down by
 * `bigStep`, Home/End to the limits. At a limit its button says why instead of greying out silently.
 */
export function NumberStepper({
  id,
  value,
  min,
  max,
  step = 1,
  bigStep = 10,
  unit,
  onChange,
  minReason,
  maxReason,
  invalid,
  describedBy: described,
}: NumberStepperProps): JSX.Element {
  const clamp = (n: number): number => Math.min(max, Math.max(min, n))
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <span className="ms-stepper" data-invalid={invalid || undefined}>
      <IconButton
        label={`Fewer ${unit}`}
        icon={<MinusIcon />}
        disabled={value <= min}
        disabledReason={minReason}
        onClick={() => onChange(clamp(value - step))}
      />
      <input
        id={id}
        className="ms-stepper__value ms-figure"
        role="spinbutton"
        inputMode="numeric"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-invalid={invalid || undefined}
        aria-describedby={described}
        value={Number.isFinite(value) ? String(value) : ''}
        onChange={(e) => {
          const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10)
          onChange(Number.isNaN(n) ? min : n)
        }}
        onKeyDown={(e) => {
          const moves: Record<string, number> = {
            ArrowUp: value + step,
            ArrowDown: value - step,
            PageUp: value + bigStep,
            PageDown: value - bigStep,
            Home: min,
            End: max,
          }
          if (e.key in moves) {
            e.preventDefault()
            onChange(clamp(moves[e.key]))
          }
        }}
      />
      <span className="ms-stepper__unit">{unit}</span>
      <IconButton
        label={`More ${unit}`}
        icon={<PlusIcon />}
        disabled={value >= max}
        disabledReason={maxReason}
        onClick={() => onChange(clamp(value + step))}
      />
    </span>
  )
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
}

/** An independent yes or no (COMPONENTS.md §Checkbox); the tick is the piped one. */
export function Checkbox({ label, className, ...rest }: CheckboxProps): JSX.Element {
  return (
    <label className={cx('ms-check', className)}>
      <span className="ms-check__box">
        <input type="checkbox" {...rest} />
        <span className="ms-check__tick" data-vfx-play={rest.checked ? 'pipe' : undefined}>
          <CheckIcon />
        </span>
      </span>
      <span>{label}</span>
    </label>
  )
}

export interface ErrorSummaryProps {
  errors: readonly { id: string; text: string }[]
  /** Focus moves here on a failed submit. */
  focusKey?: number
}

/**
 * "There is a problem" with one link per error (COMPONENTS.md §Error summary). It takes focus on a failed submit; a
 * link moves focus to its field.
 */
export function ErrorSummary({ errors, focusKey, id = 'ms-summary-heading' }: ErrorSummaryProps & { id?: string }): JSX.Element | null {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focusKey) heading.current?.focus()
  }, [focusKey])
  if (!errors.length) return null
  return (
    <div className="ms-summary" role="group" aria-labelledby={id}>
      <h3 id={id} ref={heading} tabIndex={-1}>
        There is a problem
      </h3>
      <ul>
        {errors.map((error) => (
          <li key={error.id}>
            <a
              href={`#${error.id}`}
              onClick={(event) => {
                event.preventDefault()
                const el = document.getElementById(error.id)
                el?.focus()
                el?.scrollIntoView({ block: 'center' })
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
