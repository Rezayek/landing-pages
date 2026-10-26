import { forwardRef, useId, type ChangeEvent, type JSX, type ReactNode } from 'react'
import { Spinner } from '../feedback'
import { Icon } from './icons'

export type FieldTone = 'error' | 'warning' | 'success'

export interface FieldProps {
  label: string
  hint?: ReactNode
  optional?: boolean
  message?: { tone: FieldTone; text: string } | null
  /** An async check or options loading: a waveform at the end of the control. */
  pending?: boolean
  readOnly?: boolean
  disabled?: boolean
  preview?: 'hover' | 'focus'
  children: (control: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  /** The well around the control; off for controls that draw their own (choices). */
  well?: boolean
  multiline?: boolean
  code?: boolean
  end?: ReactNode
}

const MESSAGE_ICON = { error: 'error', warning: 'warning', success: 'check' } as const

/**
 * Field: label, optional marker, hint, the control in a sunken notched well, and one message slot (error, warning or
 * success, each with its icon and words). Validation timing lives in the caller (INTERACTION.md, Forms).
 */
export function Field({
  label,
  hint,
  optional,
  message,
  pending,
  readOnly,
  disabled,
  preview,
  children,
  well = true,
  multiline,
  code,
  end,
}: FieldProps): JSX.Element {
  const id = useId()
  const hintId = `${id}-hint`
  const msgId = `${id}-msg`
  const describedBy = [message ? msgId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  const invalid = message?.tone === 'error'
  const control = children({ id, describedBy, invalid })
  return (
    <div className="ea-fld">
      <label className="ea-fld__label" htmlFor={id}>
        {label}
        {optional ? <span className="ea-fld__optional"> (optional)</span> : null}
      </label>
      {hint ? (
        <span id={hintId} className="ea-fld__hint">
          {hint}
        </span>
      ) : null}
      {well ? (
        <div
          className="ea-input ea-frame"
          data-invalid={invalid || undefined}
          data-readonly={readOnly || undefined}
          data-disabled={disabled || undefined}
          data-preview={preview}
          data-multiline={multiline || undefined}
          data-code={code || undefined}
        >
          {control}
          {pending ? <Spinner size="sm" /> : null}
          {end}
        </div>
      ) : (
        control
      )}
      {message ? (
        <span id={msgId} className="ea-fld__msg" data-tone={message.tone}>
          <Icon name={MESSAGE_ICON[message.tone]} />
          {message.text}
        </span>
      ) : null}
    </div>
  )
}

/** Text, email or search input inside a Field. */
export const TextInput = forwardRef<
  HTMLInputElement,
  {
    control: { id: string; describedBy: string | undefined; invalid: boolean }
    value: string
    onChange: (value: string) => void
    type?: 'text' | 'email' | 'search'
    placeholder?: string
    autoComplete?: string
    readOnly?: boolean
    disabled?: boolean
    inputMode?: 'text' | 'email' | 'numeric' | 'search'
    onBlur?: () => void
    maxLength?: number
  }
>(function TextInput({ control, value, onChange, type = 'text', ...rest }, ref): JSX.Element {
  return (
    <input
      ref={ref}
      id={control.id}
      type={type}
      value={value}
      aria-invalid={control.invalid || undefined}
      aria-describedby={control.describedBy}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      {...rest}
    />
  )
})

/** Search input: filters this page's list; Esc clears; the clear button appears when filled. */
export function SearchInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}): JSX.Element {
  const id = useId()
  return (
    <div className="ea-fld">
      <label className="ea-sr-only" htmlFor={id}>
        {label}
      </label>
      <div className="ea-input ea-frame">
        <Icon name="search" />
        <input
          id={id}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && value) {
              event.preventDefault()
              onChange('')
            }
          }}
        />
        {value ? (
          <button type="button" className="ea-input__clear" aria-label="Clear search" onClick={() => onChange('')}>
            <Icon name="close" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** Textarea with a character count; typing past the limit is allowed and flagged, never cut. */
export function TextareaField({
  label,
  value,
  onChange,
  limit = 500,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  limit?: number
  hint?: string
}): JSX.Element {
  const over = value.length - limit
  const tone = over > 0 ? 'error' : value.length >= limit * 0.9 ? 'warning' : undefined
  return (
    <Field
      label={label}
      hint={hint}
      optional
      multiline
      message={over > 0 ? { tone: 'error', text: `Notes must be ${limit} characters or fewer (you have ${value.length})` } : null}
    >
      {(control) => (
        <>
          <textarea
            id={control.id}
            value={value}
            aria-invalid={control.invalid || undefined}
            aria-describedby={[control.describedBy, `${control.id}-count`].filter(Boolean).join(' ')}
            onChange={(event) => onChange(event.target.value)}
          />
          <span id={`${control.id}-count`} className="ea-count" data-tone={tone} aria-live={tone ? 'polite' : 'off'}>
            {value.length} / {limit}
          </span>
        </>
      )}
    </Field>
  )
}

/** The sign-in code: one paste-safe input with one-time-code autofill. Strips spaces and dashes. */
export function CodeInput({
  value,
  onChange,
  message,
  pending,
  hint,
}: {
  value: string
  onChange: (value: string) => void
  message?: FieldProps['message']
  pending?: boolean
  hint?: string
}): JSX.Element {
  return (
    <Field label="6-digit code" hint={hint} message={message} pending={pending} code>
      {(control) => (
        <input
          id={control.id}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={9}
          value={value}
          aria-invalid={control.invalid || undefined}
          aria-describedby={control.describedBy}
          onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        />
      )}
    </Field>
  )
}

/** A group of related controls under one legend. */
export function Fieldset({
  legend,
  children,
  framed,
  message,
}: {
  legend: string
  children: ReactNode
  framed?: boolean
  message?: string | null
}): JSX.Element {
  const id = useId()
  return (
    <fieldset
      className={framed ? 'ea-fieldset ea-frame' : 'ea-fieldset'}
      data-framed={framed || undefined}
      aria-invalid={message ? true : undefined}
      aria-describedby={message ? id : undefined}
    >
      <legend>{legend}</legend>
      {children}
      {message ? (
        <span id={id} className="ea-fld__msg" data-tone="error">
          <Icon name="error" />
          {message}
        </span>
      ) : null}
    </fieldset>
  )
}

/** The error summary after a failed submit: focus moves here; each line links to its field. */
export const ErrorSummary = forwardRef<HTMLDivElement, { errors: readonly { field: string; text: string }[] }>(
  function ErrorSummary({ errors }, ref): JSX.Element {
    return (
      <div ref={ref} className="ea-summary ea-frame" tabIndex={-1} aria-labelledby="ea-summary-title">
        <h3 id="ea-summary-title">
          <Icon name="error" size="md" />
          Fix {errors.length} {errors.length === 1 ? 'thing' : 'things'} to continue
        </h3>
        <ul>
          {errors.map((error) => (
            <li key={error.field}>
              <a
                href={`#${error.field}`}
                onClick={(event) => {
                  event.preventDefault()
                  document.getElementById(error.field)?.focus()
                }}
              >
                {error.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )
  },
)
