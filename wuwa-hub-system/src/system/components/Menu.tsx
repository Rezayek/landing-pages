import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Icon, type IconName } from './icons'

export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly icon?: IconName
  readonly tone?: 'danger'
  readonly separatorBefore?: boolean
  readonly disabledReason?: string
}

/**
 * Menu button: actions on one object (WAI-ARIA menu button). Enter, Space or Down opens on the first item, Up on
 * the last; arrows, Home, End and type-ahead move; Esc closes and returns focus; Tab closes. Destructive items go
 * last, after a separator.
 */
export function MenuButton({
  label,
  items,
  onSelect,
  trigger,
  align = 'end',
  openInitially = false,
}: {
  label: string
  items: readonly MenuItem[]
  onSelect: (id: string) => void
  trigger?: ReactNode
  align?: 'start' | 'end'
  openInitially?: boolean
}): JSX.Element {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(openInitially)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (open && !openInitially) menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')[active]?.focus()
  }, [open, active, openInitially])
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent): void => {
      if (!menu.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  function close(): void {
    setOpen(false)
    button.current?.focus()
  }
  function onTriggerKey(event: KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(event.key === 'ArrowDown' ? 0 : items.length - 1)
      setOpen(true)
    }
  }
  function onMenuKey(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'Tab') setOpen(false)
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setActive(event.key === 'Home' ? 0 : items.length - 1)
    } else if (event.key.length === 1) {
      const found = items.findIndex((item) => item.label.toLowerCase().startsWith(event.key.toLowerCase()))
      if (found >= 0) setActive(found)
    }
  }

  return (
    <span className="ea-select" style={{ display: 'inline-block' }}>
      <button
        ref={button}
        type="button"
        className="ea-btn ea-frame ea-edge"
        data-variant="quiet"
        data-icon-only={trigger ? undefined : ''}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label={label}
        onClick={() => {
          setActive(0)
          setOpen((o) => !o)
        }}
        onKeyDown={onTriggerKey}
      >
        {trigger ?? <Icon name="more" size="md" />}
      </button>
      {open ? (
        <div id={`${id}-menu`} ref={menu} role="menu" aria-label={label} className="ea-pop ea-frame" data-align={align} onKeyDown={onMenuKey}>
          {items.map((item, index) => (
            <div key={item.id}>
              {item.separatorBefore ? <div className="ea-option-sep" role="separator" /> : null}
              <div
                role="menuitem"
                tabIndex={index === active ? 0 : -1}
                className="ea-option"
                data-active={index === active}
                data-tone={item.tone}
                aria-disabled={item.disabledReason ? true : undefined}
                title={item.disabledReason}
                onPointerMove={() => setActive(index)}
                onClick={() => {
                  if (item.disabledReason) return
                  onSelect(item.id)
                  close()
                }}
                onKeyDown={(event) => {
                  if ((event.key === 'Enter' || event.key === ' ') && !item.disabledReason) {
                    event.preventDefault()
                    onSelect(item.id)
                    close()
                  }
                }}
              >
                {item.icon ? <Icon name={item.icon} /> : null}
                {item.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </span>
  )
}

/** Popover: extra information or a small panel; opens on click or Enter (never on hover); Esc and outside close. */
export function Popover({
  label,
  title,
  children,
  openInitially = false,
}: {
  label: ReactNode
  title: string
  children: ReactNode
  openInitially?: boolean
}): JSX.Element {
  const id = useId()
  const host = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(openInitially)
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent): void => {
      if (!host.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])
  return (
    <span ref={host} className="ea-select" style={{ display: 'inline-block' }}>
      <button
        ref={button}
        type="button"
        className="ea-link"
        data-standalone=""
        style={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit' }}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open ? (
        <div
          id={id}
          role="dialog"
          aria-label={title}
          className="ea-popover ea-frame"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
              button.current?.focus()
            }
          }}
        >
          <h4>{title}</h4>
          {children}
        </div>
      ) : null}
    </span>
  )
}

/** Tooltip: a short name or abbreviation; opens after --tooltip-delay on hover and at once on focus; Esc closes. */
export function Tooltip({ text, children, openInitially = false }: { text: string; children: ReactNode; openInitially?: boolean }): JSX.Element {
  const id = useId()
  const [open, setOpen] = useState(openInitially)
  const timer = useRef<number | undefined>(undefined)
  const delay = (): number => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tooltip-delay')) || 500
  return (
    <span
      className="ea-tip-host"
      aria-describedby={id}
      tabIndex={0}
      onMouseEnter={() => {
        timer.current = window.setTimeout(() => setOpen(true), delay())
      }}
      onMouseLeave={() => {
        window.clearTimeout(timer.current)
        setOpen(false)
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
      style={{ textDecoration: 'underline dotted', textUnderlineOffset: '0.2em' }}
    >
      {children}
      <span id={id} role="tooltip" className={open ? 'ea-tip ea-frame' : 'ea-sr-only'}>
        {text}
      </span>
    </span>
  )
}
