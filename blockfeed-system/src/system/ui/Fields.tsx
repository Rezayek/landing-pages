import {
  forwardRef,
  useId,
  type ChangeEvent,
  type InputHTMLAttributes,
  type JSX,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from '../pixel/Icon'
import './ui.css'

interface FieldChrome {
  readonly label: string
  readonly hint?: ReactNode
  readonly error?: ReactNode
  /** the label stays in the DOM for assistive technology but is not drawn (a search box with its own icon) */
  readonly hideLabel?: boolean
  readonly optional?: boolean
}

interface FieldProps extends FieldChrome {
  readonly id: string
  readonly children: ReactNode
}

function Field({ id, label, hint, error, hideLabel, optional, children }: FieldProps): JSX.Element {
  return (
    <div className="bf-field">
      <label htmlFor={id} className={hideLabel ? 'bf-sr' : 'bf-label'}>
        {label}
        {optional ? <span className="bf-subtle"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p className="bf-error" id={`${id}-error`}>
          <Icon name="warn" size="sm" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="bf-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const described = (id: string, hint: unknown, error: unknown): string | undefined => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

export type TextFieldProps = FieldChrome & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { id?: string }

/** A black input well with a bright edge on focus. The error replaces the hint, names the problem and says what to do. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, hideLabel, optional, id: idProp, className, ...rest },
  ref,
): JSX.Element {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} optional={optional}>
      <input
        ref={ref}
        id={id}
        {...rest}
        className={`bf-input${className ? ` ${className}` : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={described(id, hint, error)}
      />
    </Field>
  )
})

export type TextAreaProps = FieldChrome & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { id?: string }

export function TextArea({ label, hint, error, hideLabel, optional, id: idProp, maxLength, value, className, ...rest }: TextAreaProps): JSX.Element {
  const auto = useId()
  const id = idProp ?? auto
  const used = typeof value === 'string' ? value.length : 0
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} optional={optional}>
      <textarea
        id={id}
        {...rest}
        value={value}
        maxLength={maxLength}
        className={`bf-input${className ? ` ${className}` : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={described(id, hint, error)}
      />
      {maxLength ? (
        <span className="bf-count-hint bf-num" aria-live="off">
          {used} / {maxLength}
        </span>
      ) : null}
    </Field>
  )
}

export function SearchField({ label = 'Search', ...rest }: Omit<TextFieldProps, 'label' | 'type' | 'hideLabel'> & { label?: string }): JSX.Element {
  const auto = useId()
  const id = rest.id ?? auto
  return (
    <div className="bf-field" role="search" aria-label={label}>
      <label htmlFor={id} className="bf-sr">
        {label}
      </label>
      <span className="bf-inputwrap">
        <span className="bf-inputwrap__icon">
          <Icon name="search" />
        </span>
        <input {...rest} id={id} type="search" className="bf-input" />
      </span>
    </div>
  )
}

export type SelectProps = FieldChrome & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { id?: string; options: readonly { value: string; label: string }[] }

/** A native select drawn as a button, so the list stays the platform's own and fully accessible. */
export function Select({ label, hint, error, hideLabel, optional, id: idProp, options, className, ...rest }: SelectProps): JSX.Element {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} optional={optional}>
      <span className="bf-select">
        <select id={id} {...rest} className={`bf-btn${className ? ` ${className}` : ''}`} aria-describedby={described(id, hint, error)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="bf-select__icon">
          <Icon name="chevronDown" size="sm" />
        </span>
      </span>
    </Field>
  )
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label: string
  readonly hint?: string
}

export function Checkbox({ label, hint, className, ...rest }: CheckboxProps): JSX.Element {
  return (
    <label className={`bf-check${className ? ` ${className}` : ''}`}>
      <input {...rest} type="checkbox" className="bf-sr" />
      <span className="bf-check__box" aria-hidden="true">
        {rest.checked ? <Icon name="check" size="sm" /> : null}
      </span>
      <span className="bf-check__text">
        <span>{label}</span>
        {hint ? <span className="bf-hint">{hint}</span> : null}
      </span>
    </label>
  )
}

export interface RadioGroupProps<T extends string> {
  readonly legend: string
  readonly value: T
  readonly onChange: (value: T) => void
  readonly options: readonly { readonly value: T; readonly label: string; readonly hint?: string }[]
  readonly error?: ReactNode
}

/** One choice from up to five, all visible: the reason for a report, a visibility setting. */
export function RadioGroup<T extends string>({ legend, value, onChange, options, error }: RadioGroupProps<T>): JSX.Element {
  const name = useId()
  return (
    <fieldset className="bf-fieldset" aria-invalid={error ? true : undefined}>
      <legend className="bf-label">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="bf-check">
          <input type="radio" className="bf-sr" name={name} value={o.value} checked={o.value === value} onChange={() => onChange(o.value)} />
          <span className="bf-check__box" aria-hidden="true">
            {o.value === value ? <span className="bf-check__dot" /> : null}
          </span>
          <span className="bf-check__text">
            <span>{o.label}</span>
            {o.hint ? <span className="bf-hint">{o.hint}</span> : null}
          </span>
        </label>
      ))}
      {error ? (
        <p className="bf-error">
          <Icon name="warn" size="sm" />
          <span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  )
}

export interface ToggleProps {
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  readonly disabled?: boolean
}

/** The ON / OFF switch: a black bar with the setting's name and its state in words and an icon, never colour alone. */
export function Toggle({ label, checked, onChange, disabled }: ToggleProps): JSX.Element {
  return (
    <button type="button" role="switch" aria-checked={checked} className="bf-toggle" disabled={disabled} onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span className="bf-toggle__state">
        <Icon name={checked ? 'check' : 'cross'} size="sm" />
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}

export interface SliderProps {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step?: number
  readonly onChange: (value: number) => void
  readonly format?: (value: number) => string
}

export function Slider({ label, value, min, max, step = 1, onChange, format }: SliderProps): JSX.Element {
  const id = useId()
  return (
    <div className="bf-field">
      <label htmlFor={id} className="bf-label bf-row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span>{label}</span>
        <span className="bf-num">{format ? format(value) : value}</span>
      </label>
      <input id={id} className="bf-range" type="range" min={min} max={max} step={step} value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))} />
    </div>
  )
}

export interface CycleButtonProps<T extends string> {
  readonly label: string
  readonly value: T
  readonly onChange: (value: T) => void
  readonly options: readonly { readonly value: T; readonly label: string }[]
  readonly block?: boolean
}

/** The game's cycle button: "Version: 1.21". A press moves to the next option, Shift or the left arrow to the last. */
export function CycleButton<T extends string>({ label, value, onChange, options, block }: CycleButtonProps<T>): JSX.Element {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const go = (delta: number): void => onChange(options[(index + delta + options.length) % options.length].value)
  const current = options[index]
  return (
    <button
      type="button"
      className="bf-btn"
      data-block={block ? '' : undefined}
      aria-label={`${label}: ${current.label}. Press to change.`}
      onClick={(e) => go(e.shiftKey ? -1 : 1)}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      style={{ justifyContent: 'space-between' }}
    >
      <span>
        {label}: <span className="bf-num">{current.label}</span>
      </span>
      <Icon name="chevronRight" size="sm" shadow />
    </button>
  )
}
