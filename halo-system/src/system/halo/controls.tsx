/**
 * HALO's core controls, built to COMPONENTS.md: Button, IconButton, TextLink, Field, ErrorSummary, SegmentedChoice,
 * SwatchPicker, DialControl, Figure, SpecList, ThemeSwitch. They read roles from tokens.css through halo.css and
 * never a raw value. A control with a wait is the feedback set's ActionButton, not one of these.
 */
import {
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { announce } from '../feedback'
import { playHalo } from '../vfx'
import { MinusIcon, NextIcon, PlusIcon, PrevIcon } from './icons'
import { applyTheme, readTheme, type ThemeChoice } from './theme'

const cx = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' ')

// ------------------------------------------------------------------------------------------------------------
// Button, IconButton, TextLink
// ------------------------------------------------------------------------------------------------------------
export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'quiet'
  size?: 'default' | 'large'
  /** Pins a look for the /system page: hover, focus, pressed. */
  preview?: 'hover' | 'focus' | 'pressed'
  /** Unavailable: stays focusable and says why (`unavailable` is linked by aria-describedby). */
  unavailable?: string
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'secondary', size = 'default', preview, unavailable, className, children, onClick, ...rest }: ButtonProps): JSX.Element {
  const reason = useId()
  return (
    <>
      <button
        type="button"
        {...rest}
        className={cx('h-btn', className)}
        data-variant={variant}
        data-size={size}
        data-preview={preview}
        aria-disabled={unavailable ? true : undefined}
        aria-describedby={unavailable ? reason : rest['aria-describedby']}
        onClick={(event) => {
          if (unavailable) {
            announce(unavailable)
            return
          }
          onClick?.(event)
        }}
      >
        {children}
      </button>
      {unavailable ? (
        <span id={reason} className="h-btn__reason">
          {unavailable}
        </span>
      ) : null}
    </>
  )
}

export interface IconButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'children'> {
  label: string
  icon: ReactNode
  variant?: 'quiet' | 'secondary'
  preview?: 'hover' | 'focus' | 'pressed'
}

/** A 44 px target around a 20 px glyph. The name shows as a visible label on focus (no hover-only tooltip). */
export function IconButton({ label, icon, variant = 'quiet', preview, className, ...rest }: IconButtonProps): JSX.Element {
  return (
    <button type="button" {...rest} className={cx('h-iconbtn', className)} data-variant={variant} data-preview={preview} aria-label={label}>
      {icon}
      <span className="h-iconbtn__tip" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}

export function TextLink({ className, variant = 'inline', current, ...rest }: ComponentPropsWithoutRef<'a'> & { variant?: 'inline' | 'nav'; current?: boolean }): JSX.Element {
  return <a {...rest} className={cx('h-link', className)} data-variant={variant} aria-current={current ? 'true' : undefined} />
}

// ------------------------------------------------------------------------------------------------------------
// Field and ErrorSummary
// ------------------------------------------------------------------------------------------------------------
export interface FieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'id'> {
  label: string
  hint?: string
  error?: string | null
  warning?: string | null
  unit?: string
  id?: string
  /** Keep the message line's height even when there is no message, so a new error moves nothing. */
  reserveMessage?: boolean
  /** A control that belongs to the input (Find my size), drawn in the input's row so a message never moves it. */
  action?: ReactNode
  ref?: Ref<HTMLInputElement>
}

export function Field({ label, hint, error, warning, unit, id, className, reserveMessage, action, ...rest }: FieldProps): JSX.Element {
  const own = useId()
  const inputId = id ?? own
  const hintId = `${inputId}-hint`
  const msgId = `${inputId}-msg`
  const described = [hint ? hintId : null, error || warning ? msgId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className={cx('h-field', className)} data-state={error ? 'error' : warning ? 'warning' : undefined}>
      <label htmlFor={inputId} className="h-field__label">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="h-field__hint">
          {hint}
        </p>
      ) : null}
      <div className="h-field__control">
        <span className="h-field__box">
          <input id={inputId} {...rest} aria-invalid={error ? true : undefined} aria-describedby={described} />
          {unit ? (
            <span className="h-field__unit" aria-hidden="true">
              {unit}
            </span>
          ) : null}
        </span>
        {action}
      </div>
      {error || warning ? (
        <p id={msgId} className="h-field__msg">
          <span className="h-sr">{error ? 'Error: ' : 'Note: '}</span>
          <span className="h-field__msgicon" aria-hidden="true">
            {error ? '!' : '△'}
          </span>
          {error ?? warning}
        </p>
      ) : reserveMessage ? (
        <p className="h-field__msg" aria-hidden="true" />
      ) : null}
    </div>
  )
}

export interface ErrorSummaryProps {
  heading: string
  errors: readonly { id: string; text: string }[]
  ref?: Ref<HTMLDivElement>
}

/** Rendered above a form of three or more fields after a failed submit; the caller moves focus to it. */
export function ErrorSummary({ heading, errors, ref }: ErrorSummaryProps): JSX.Element | null {
  const headingId = useId()
  if (!errors.length) return null
  return (
    <div ref={ref} className="h-summary" role="group" aria-labelledby={headingId} tabIndex={-1}>
      <h3 id={headingId} className="h-summary__heading">
        {heading}
      </h3>
      <ul>
        {errors.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(event) => {
                event.preventDefault()
                const field = document.getElementById(e.id)
                field?.focus()
                field?.scrollIntoView({ block: 'center' })
              }}
            >
              {e.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// Radio-group pattern, shared by SegmentedChoice and SwatchPicker
// ------------------------------------------------------------------------------------------------------------
interface RadioOption {
  readonly id: string
  readonly label: string
  readonly unavailable?: boolean
}

function useRadioKeys<T extends RadioOption>(options: readonly T[], value: string, onChange: (id: string) => void) {
  const refs = useRef<(HTMLElement | null)[]>([])
  function onKeyDown(event: KeyboardEvent): void {
    const index = options.findIndex((o) => o.id === value)
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = index
    if (event.key in keys) next = (index + keys[event.key] + options.length) % options.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = options.length - 1
    else return
    event.preventDefault()
    onChange(options[next].id)
    refs.current[next]?.focus()
  }
  return { refs, onKeyDown }
}

export interface SegmentedChoiceProps {
  label: string
  options: readonly (RadioOption & { sub?: string })[]
  value: string
  onChange: (id: string) => void
  compact?: boolean
  /** Hide the visible group label (it stays as the accessible name). */
  hideLabel?: boolean
  /** Shown after the label, muted: the selected option's detail ("from €599"). */
  note?: string
}

export function SegmentedChoice({ label, options, value, onChange, compact, hideLabel, note }: SegmentedChoiceProps): JSX.Element {
  const labelId = useId()
  const { refs, onKeyDown } = useRadioKeys(options, value, onChange)
  return (
    <div className="h-seg" data-compact={compact || undefined}>
      <span id={labelId} className={hideLabel ? 'h-sr' : 'h-group-label'}>
        {label}
        {note ? <span className="h-swatch__name"> · {note}</span> : null}
      </span>
      <div className="h-seg__track" role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        {options.map((o, i) => {
          const on = o.id === value
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={on}
              aria-disabled={o.unavailable || undefined}
              tabIndex={on ? 0 : -1}
              className="h-seg__opt"
              onClick={() => onChange(o.id)}
            >
              <span>{o.label}</span>
              {o.sub ? <span className="h-seg__sub">{o.sub}</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export interface SwatchPickerProps {
  label: string
  options: readonly (RadioOption & { hex: string })[]
  value: string
  onChange: (id: string) => void
  shape?: 'band' | 'finish'
}

export function SwatchPicker({ label, options, value, onChange, shape = 'band' }: SwatchPickerProps): JSX.Element {
  const labelId = useId()
  const { refs, onKeyDown } = useRadioKeys(options, value, onChange)
  const current = options.find((o) => o.id === value)
  return (
    <div className="h-swatch">
      <p id={labelId} className="h-group-label">
        {label} <span className="h-swatch__name">· {current?.label}{current?.unavailable ? ', sold out in this size' : ''}</span>
      </p>
      <div className="h-swatch__row" role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        {options.map((o, i) => {
          const on = o.id === value
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={o.unavailable ? `${o.label}, sold out in this size` : o.label}
              aria-disabled={o.unavailable || undefined}
              tabIndex={on ? 0 : -1}
              className="h-swatch__chip"
              data-shape={shape}
              data-soldout={o.unavailable || undefined}
              style={{ ['--chip' as string]: o.hex }}
              onClick={() => onChange(o.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// DialControl: the side dial's detent scale (the graft from direction B)
// ------------------------------------------------------------------------------------------------------------
export interface DialControlProps {
  label: string
  steps: readonly { id: string; label: string }[]
  value: number
  onChange: (index: number) => void
  /** Minor ticks between two steps. */
  minor?: number
}

export function DialControl({ label, steps, value, onChange, minor = 4 }: DialControlProps): JSX.Element {
  const labelId = useId()
  const index = useRef<HTMLSpanElement>(null)
  const scale = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const last = steps.length - 1
  const at = steps[value]
  const valueText = `${at?.label} face, ${value + 1} of ${steps.length}`

  function set(next: number, speak = false): void {
    const clamped = Math.max(0, Math.min(last, next))
    if (clamped === value) return
    onChange(clamped)
    void playHalo(index.current, 'detent')
    if (speak) announce(`${steps[clamped].label} face`)
  }

  function fromPointer(event: PointerEvent): number {
    const box = scale.current?.getBoundingClientRect()
    if (!box) return value
    return Math.round(((event.clientX - box.left) / box.width) * last)
  }

  function onKeyDown(event: KeyboardEvent): void {
    const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 2, PageDown: -2 }
    if (event.key in map) set(value + map[event.key])
    else if (event.key === 'Home') set(0)
    else if (event.key === 'End') set(last)
    else return
    event.preventDefault()
  }

  const ticks: { major: boolean; step?: number }[] = []
  for (let s = 0; s <= last; s++) {
    ticks.push({ major: true, step: s })
    if (s < last) for (let m = 0; m < minor; m++) ticks.push({ major: false })
  }
  const pct = last ? (value / last) * 100 : 0

  return (
    <div className="h-dial">
      <p id={labelId} className="h-group-label">
        {label} <span className="h-swatch__name">· {at?.label}</span>
      </p>
      <div className="h-dial__row">
        <IconButton label="Previous face" icon={<PrevIcon />} onClick={() => set(value - 1, true)} />
        <div
          ref={scale}
          className="h-dial__scale"
          role="slider"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={value + 1}
          aria-valuetext={valueText}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            dragging.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            set(fromPointer(e))
          }}
          onPointerMove={(e) => {
            if (dragging.current) set(fromPointer(e))
          }}
          onPointerUp={(e) => {
            dragging.current = false
            e.currentTarget.releasePointerCapture(e.pointerId)
            announce(`${steps[fromPointer(e) < 0 ? 0 : Math.min(last, fromPointer(e))].label} face`)
          }}
        >
          <span className="h-dial__ticks" aria-hidden="true">
            {ticks.map((t, i) => (
              <i key={i} data-major={t.major || undefined} data-on={t.step === value || undefined} />
            ))}
          </span>
          <span className="h-dial__index" style={{ left: `${pct}%` }} aria-hidden="true">
            <span ref={index} />
          </span>
        </div>
        <IconButton label="Next face" icon={<NextIcon />} onClick={() => set(value + 1, true)} />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// Figure, SpecList
// ------------------------------------------------------------------------------------------------------------
export interface FigureProps {
  value: string
  unit?: string
  caption?: string
  size?: 'stage' | 'display' | 'inline'
  note?: string
}

export function Figure({ value, unit, caption, size = 'stage', note }: FigureProps): JSX.Element {
  return (
    <figure className="h-figure" data-size={size}>
      <p className="h-figure__value">
        {value}
        {unit ? <span className="h-figure__unit"> {unit}</span> : null}
      </p>
      {caption ? <figcaption className="h-figure__caption">{caption}</figcaption> : null}
      {note ? <p className="h-figure__note">{note}</p> : null}
    </figure>
  )
}

export interface SpecListProps {
  groups: readonly { id: string; title: string; rows: readonly (readonly [string, string])[] }[]
  /** Groups open at first. */
  initiallyOpen?: readonly string[]
}

export function SpecList({ groups, initiallyOpen = [] }: SpecListProps): JSX.Element {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set(initiallyOpen))
  const uid = useId()
  const all = open.size === groups.length
  return (
    <div className="h-specs" data-density="compact">
      <div className="h-specs__bar">
        <Button variant="quiet" onClick={() => setOpen(all ? new Set() : new Set(groups.map((g) => g.id)))}>
          {all ? 'Close all' : 'Open all'}
        </Button>
      </div>
      {groups.map((g) => {
        const on = open.has(g.id)
        const panel = `${uid}-${g.id}`
        return (
          <section key={g.id} className="h-specs__group">
            <h3 className="h-specs__heading">
              <button
                type="button"
                aria-expanded={on}
                aria-controls={panel}
                onClick={() =>
                  setOpen((prev) => {
                    const next = new Set(prev)
                    if (on) next.delete(g.id)
                    else next.add(g.id)
                    return next
                  })
                }
              >
                <span>{g.title}</span>
                {on ? <MinusIcon /> : <PlusIcon />}
              </button>
            </h3>
            <dl id={panel} className="h-specs__rows" hidden={!on}>
              {g.rows.map(([k, v]) => (
                <div key={k} className="h-specs__row">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------------------------------------------------
// ThemeSwitch: System, Light, Dark for the chrome; the stages never switch
// ------------------------------------------------------------------------------------------------------------
export function ThemeSwitch({ onChange }: { onChange?: (choice: ThemeChoice) => void }): JSX.Element {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme)
  return (
    <SegmentedChoice
      label="Theme"
      compact
      options={[
        { id: 'system', label: 'System' },
        { id: 'light', label: 'Light' },
        { id: 'dark', label: 'Dark' },
      ]}
      value={choice}
      onChange={(id) => {
        const next = id as ThemeChoice
        setChoice(next)
        applyTheme(next)
        onChange?.(next)
      }}
    />
  )
}
