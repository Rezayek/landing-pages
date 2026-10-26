/**
 * Select, designed: the WAI-ARIA select-only combobox (COMPONENTS.md §Select / listbox). A cut field shows the value
 * with a chevron; the popup is a listbox on `--raised` with the popover motion. Keyboard: closed, Down/Up/Enter/Space
 * open it, Home/End open on the first or last option, typing jumps to a match; open, arrows move, Enter/Space pick,
 * Esc closes without a change, Tab picks and leaves. Focus never leaves the field; the active option is
 * `aria-activedescendant`. The native <select> stays available (`native`) for phones and plain forms.
 */
import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent } from 'react'
import { Skeleton } from '../feedback'
import { CheckIcon, ChevronDownIcon } from '../feedback/icons'
import { FieldLine, NativeSelect } from './forms'
import './vc.css'

export interface ListboxOption<T extends string> {
  id: T
  label: string
  description?: string
  disabled?: boolean
}

export interface ListboxProps<T extends string> {
  label: string
  value: T | ''
  onChange: (value: T) => void
  options: readonly ListboxOption<T>[]
  placeholder?: string
  hint?: string
  error?: string
  /** Options are still loading: one skeleton row and "Loading options". */
  loading?: boolean
  fieldId?: string
}

export function Listbox<T extends string>({ label, value, onChange, options, placeholder = 'Choose…', hint, error, loading, fieldId }: ListboxProps<T>): JSX.Element {
  const generated = useId()
  const id = fieldId ?? generated
  const labelId = `${id}-label`
  const listId = `${id}-list`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrap = useRef<HTMLDivElement>(null)
  const typed = useRef({ text: '', at: 0 })
  const current = options.find((o) => o.id === value)
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0)

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active, listId])

  function show(at: number): void {
    setActive(at)
    setOpen(true)
  }
  function pick(index: number): void {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.id)
    setOpen(false)
  }
  function step(from: number, dir: 1 | -1): number {
    const pos = enabled.indexOf(from)
    if (pos < 0) return dir === 1 ? enabled[0] : enabled[enabled.length - 1]
    return enabled[Math.min(enabled.length - 1, Math.max(0, pos + dir))]
  }
  function match(key: string): number {
    const now = Date.now()
    typed.current = { text: now - typed.current.at > 600 ? key : typed.current.text + key, at: now }
    const start = Math.max(0, open ? active : options.findIndex((o) => o.id === value))
    const order = [...options.keys()].map((i) => (i + start + (typed.current.text.length === 1 ? 1 : 0)) % options.length)
    return order.find((i) => !options[i].disabled && options[i].label.toLowerCase().startsWith(typed.current.text.toLowerCase())) ?? -1
  }

  function onKeyDown(event: KeyboardEvent): void {
    const selected = options.findIndex((o) => o.id === value)
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        show(selected >= 0 ? selected : enabled[0] ?? -1)
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        show(event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1])
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        const at = match(event.key)
        if (at >= 0) onChange(options[at].id)
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive((a) => step(a, 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive((a) => step(a, -1))
        break
      case 'Home':
        event.preventDefault()
        setActive(enabled[0])
        break
      case 'End':
        event.preventDefault()
        setActive(enabled[enabled.length - 1])
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        pick(active)
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        pick(active)
        break
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const at = match(event.key)
          if (at >= 0) setActive(at)
        }
    }
  }

  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  return (
    <div className="vc-field" ref={wrap}>
      <span id={labelId} className="vc-field__label">
        {label}
      </span>
      <div className="vc-anchor vc-select">
        <div
          id={id}
          role="combobox"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="vc-input vc-cut vc-select__trigger"
          data-invalid={Boolean(error)}
          data-open={open || undefined}
          onClick={() => (open ? setOpen(false) : show(Math.max(0, options.findIndex((o) => o.id === value))))}
          onKeyDown={onKeyDown}
          onBlur={(event) => {
            if (!wrap.current?.contains(event.relatedTarget as Node)) setOpen(false)
          }}
        >
          <span className="vc-select__value" data-placeholder={current ? undefined : true}>
            {current?.label ?? placeholder}
          </span>
          <span className="vc-icon vc-select__chevron" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </div>
        {open ? (
          <ul id={listId} role="listbox" aria-labelledby={labelId} aria-busy={loading || undefined} className="vc-menu vc-cut vc-cut--card vc-select__list">
            {loading ? (
              <li className="vc-select__option" aria-disabled="true">
                <Skeleton width="60%" />
                <span className="vc-sr">Loading options</span>
              </li>
            ) : options.length === 0 ? (
              <li className="vc-select__option vc-muted" aria-disabled="true">
                No options
              </li>
            ) : (
              options.map((option, index) => (
                <li
                  key={option.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={option.id === value}
                  aria-disabled={option.disabled || undefined}
                  data-active={index === active || undefined}
                  className="vc-select__option"
                  onPointerDown={(event) => event.preventDefault()}
                  onPointerMove={() => !option.disabled && setActive(index)}
                  onClick={() => pick(index)}
                >
                  <span className="vc-select__text">
                    {option.label}
                    {option.description ? <span className="vc-check__desc">{option.description}</span> : null}
                  </span>
                  {option.id === value ? (
                    <span className="vc-icon vc-select__check" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {error ? <FieldLine id={errorId} tone="error" text={error} /> : null}
      {hint ? (
        <p id={hintId} className="vc-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** The system's select: the designed listbox; `native` hands over to the platform picker (NativeSelect). */
export function Select<T extends string>({ native, value, onChange, options, label, hint, error, placeholder, loading, fieldId }: ListboxProps<T> & { native?: boolean }): JSX.Element {
  if (native) {
    return <NativeSelect label={label} hint={hint} error={error} value={value as T} onChange={onChange} options={options} />
  }
  return <Listbox label={label} hint={hint} error={error} value={value} onChange={onChange} options={options} placeholder={placeholder} loading={loading} fieldId={fieldId} />
}
