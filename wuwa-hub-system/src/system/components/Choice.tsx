import { useEffect, useId, useRef, type JSX } from 'react'
import { Spinner } from '../feedback'
import { Icon } from './icons'

/** Checkbox: independent on/off; a parent can be indeterminate. Native input, drawn by the tokens. */
export function Checkbox({
  label,
  checked,
  indeterminate = false,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  indeterminate?: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}): JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <label className="ea-check">
      <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}

/** Radio group: one answer from 2-6 visible options, in a fieldset with a legend. Arrow keys move and select. */
export function RadioGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  error,
}: {
  legend: string
  options: readonly { id: T; label: string; disabled?: boolean }[]
  value: T | null
  onChange: (next: T) => void
  error?: string | null
}): JSX.Element {
  const name = useId()
  return (
    <fieldset className="ea-fieldset" aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-err` : undefined}>
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.id} className="ea-check">
          <input
            type="radio"
            name={name}
            checked={value === option.id}
            disabled={option.disabled}
            onChange={() => onChange(option.id)}
          />
          {option.label}
        </label>
      ))}
      {error ? (
        <span id={`${name}-err`} className="ea-fld__msg" data-tone="error">
          <Icon name="error" />
          {error}
        </span>
      ) : null}
    </fieldset>
  )
}

/**
 * Switch: a setting that applies at once and saves. Optimistic: the thumb moves at once; while saving a waveform
 * sits beside the label; on failure the caller returns the value and passes `error`.
 */
export function Switch({
  label,
  checked,
  onChange,
  pending,
  error,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
  pending?: boolean
  error?: string | null
}): JSX.Element {
  const errorId = useId()
  return (
    <div className="ea-fld">
      <button
        type="button"
        role="switch"
        className="ea-switch"
        aria-checked={checked}
        aria-busy={pending || undefined}
        aria-describedby={error ? errorId : undefined}
        onClick={() => onChange(!checked)}
      >
        <span className="ea-switch__track ea-frame" aria-hidden="true">
          <span className="ea-switch__thumb" />
        </span>
        <span>{label}</span>
        <span className="ea-switch__state" aria-hidden="true">
          {checked ? 'On' : 'Off'}
        </span>
        {pending ? <Spinner size="sm" /> : null}
      </button>
      {error ? (
        <span id={errorId} className="ea-fld__msg" data-tone="error">
          <Icon name="error" />
          {error}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Slider with its number field: the native range input (keyboard: arrows, Page Up/Down, Home, End; a click on the
 * track jumps) plus a number input, so dragging is never the only way.
 */
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  ticks,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  ticks?: readonly number[]
}): JSX.Element {
  const id = useId()
  const clamp = (n: number): number => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min))
  return (
    <div className="ea-fld">
      <label className="ea-fld__label" htmlFor={id}>
        {label}
      </label>
      <div className="ea-slider">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          aria-valuetext={`${label} ${value} of ${max}`}
          onChange={(event) => onChange(clamp(Number(event.target.value)))}
        />
        <div className="ea-input ea-frame">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            aria-label={`${label}, number`}
            onChange={(event) => onChange(clamp(Number(event.target.value)))}
          />
        </div>
        {ticks ? (
          <div className="ea-slider__ticks" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
