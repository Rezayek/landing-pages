import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Spinner, announce } from '../feedback'
import { Icon } from './icons'

function useOutside(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void): void {
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [ref, open, close])
}

/**
 * Select (select-only combobox): one value from a short known list, or several (`multiple`) with a count in the
 * trigger. Enter, Space or Down opens; arrows move; type-ahead; Enter selects; Esc closes and returns focus.
 */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Any',
  multiple = false,
  hideLabel = false,
  openInitially = false,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: readonly T[]
  onChange: (next: T[]) => void
  placeholder?: string
  multiple?: boolean
  hideLabel?: boolean
  openInitially?: boolean
}): JSX.Element {
  const id = useId()
  const host = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(openInitially)
  const [active, setActive] = useState(0)
  useOutside(host, open, () => setOpen(false))

  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((option) => option.id === value[0])?.label ?? placeholder)
        : `${value.length} ${label.toLowerCase()}s`

  function choose(choice: T): void {
    if (multiple) onChange(value.includes(choice) ? value.filter((v) => v !== choice) : [...value, choice])
    else {
      onChange([choice])
      setOpen(false)
      trigger.current?.focus()
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!open && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActive(event.key === 'Home' ? 0 : options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(options[active].id)
    } else if (event.key.length === 1) {
      const found = options.findIndex((option) => option.label.toLowerCase().startsWith(event.key.toLowerCase()))
      if (found >= 0) setActive(found)
    }
  }

  return (
    <div className="ea-fld ea-select" ref={host}>
      <span id={`${id}-label`} className={hideLabel ? 'ea-sr-only' : 'ea-fld__label'}>
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        className="ea-input ea-frame ea-select__trigger"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span id={`${id}-value`}>{summary}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} />
      </button>
      {open ? (
        <div id={`${id}-list`} role="listbox" aria-multiselectable={multiple || undefined} className="ea-pop ea-frame">
          {options.map((option, index) => {
            const selected = value.includes(option.id)
            return (
              <div
                key={option.id}
                id={`${id}-${index}`}
                role="option"
                aria-selected={selected}
                className="ea-option"
                data-active={index === active}
                onPointerMove={() => setActive(index)}
                onClick={() => choose(option.id)}
              >
                {option.label}
                {selected ? (
                  <span className="ea-option__end">
                    <Icon name="check" />
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export interface ComboOption {
  readonly id: string
  readonly label: string
  readonly lead?: ReactNode
  readonly meta?: ReactNode
}

/**
 * Combobox with list autocomplete: pick one of many by typing (Resonators, Echoes). Words match in any order and any
 * case. Shows "Searching…" while options load, an empty row and an error row with Try again.
 */
export function Combobox({
  label,
  options,
  onSelect,
  placeholder,
  status = 'ready',
  onRetry,
  clearOnSelect = false,
  noun = 'Resonator',
}: {
  label: string
  options: readonly ComboOption[]
  onSelect: (option: ComboOption) => void
  placeholder?: string
  status?: 'ready' | 'pending' | 'error'
  onRetry?: () => void
  clearOnSelect?: boolean
  /** What the options are, singular, for the no-match and error lines: "No Echo named …". */
  noun?: string
}): JSX.Element {
  const id = useId()
  const host = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  useOutside(host, open, () => setOpen(false))
  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return options.filter((option) => words.every((word) => option.label.toLowerCase().includes(word))).slice(0, 8)
  }, [options, query])
  // the result is spoken through announce() once the person pauses typing (no live region of its own): the count, or
  // the no-results line with its next step
  const count = open && status === 'ready' ? matches.length : null
  useEffect(() => {
    if (count === null || !query) return
    const said =
      count === 0
        ? `No ${noun} named “${query}”. Check the spelling or type part of the name.`
        : `${count} ${count === 1 ? 'match' : 'matches'}`
    const t = window.setTimeout(() => announce(said), 500)
    return () => window.clearTimeout(t)
  }, [count, query, noun])

  function pick(option: ComboOption): void {
    onSelect(option)
    setQuery(clearOnSelect ? '' : option.label)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      if (matches.length) setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length)
    } else if (event.key === 'Enter' && open && matches[active]) {
      event.preventDefault()
      pick(matches[active])
    } else if (event.key === 'Escape') {
      if (open) setOpen(false)
      else setQuery('')
    }
  }

  return (
    <div className="ea-fld ea-select" ref={host}>
      <label className="ea-fld__label" htmlFor={id}>
        {label}
      </label>
      <div className="ea-input ea-frame">
        <Icon name="search" />
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          // leaving the field closes the list (focus moving to "Try again" inside it keeps it open); a search field
          // (clearOnSelect) never holds a value, so a query that matches nothing is cleared on leaving
          onBlur={(event) => {
            if (host.current?.contains(event.relatedTarget)) return
            setOpen(false)
            if (clearOnSelect && matches.length === 0) setQuery('')
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open ? (
        <div id={`${id}-list`} role="listbox" className="ea-pop ea-frame" aria-busy={status === 'pending' || undefined}>
          {status === 'pending' ? (
            <div className="ea-option-note">
              <Spinner size="sm" /> Searching…
            </div>
          ) : status === 'error' ? (
            <div className="ea-option-note">
              <Icon name="error" /> Couldn't load {noun}s.
              <button type="button" className="ea-link" data-standalone="" onClick={onRetry} style={{ border: 0, background: 'none' }}>
                Try again
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="ea-option-note">
              No {noun} named “{query}”. Check the spelling or type part of the name.
            </div>
          ) : (
            matches.map((option, index) => (
              <div
                key={option.id}
                id={`${id}-${index}`}
                role="option"
                aria-selected={index === active}
                className="ea-option"
                data-active={index === active}
                onPointerMove={() => setActive(index)}
                // the field keeps focus through a pointer pick, so focus never falls to the page
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option)}
              >
                {option.lead}
                {option.label}
                {option.meta ? <span className="ea-option__end">{option.meta}</span> : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
