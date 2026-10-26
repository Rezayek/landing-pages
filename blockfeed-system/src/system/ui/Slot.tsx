import { useRef, type CSSProperties, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../pixel/Icon'
import type { IconName } from '../pixel/icons'
import { Count } from './Display'
import { Tooltip } from './Tooltip'
import './ui.css'

export interface SlotProps {
  /** what sits in the slot: an icon, a sprite, a picture */
  readonly children?: ReactNode
  /** a stack count, drawn in the bottom-right corner like an item stack */
  readonly count?: number
  readonly label?: string
  readonly selected?: boolean
  readonly onClick?: () => void
  readonly href?: string
  readonly disabled?: boolean
  readonly hot?: boolean
  readonly style?: CSSProperties
  readonly className?: string
}

/** One inventory slot. Interactive when it has an `onClick` or an `href`; then it needs a `label`. */
export function Slot({ children, count, label, selected, onClick, href, disabled, hot, style, className }: SlotProps): JSX.Element {
  const body = (
    <>
      {children}
      {count && count > 1 ? <span className="bf-slot__count">{count > 99 ? '99+' : count}</span> : null}
    </>
  )
  const common = {
    className: `bf-slot${className ? ` ${className}` : ''}`,
    style,
    'aria-label': label,
    'data-hot': hot ? '' : undefined,
  }
  if (href) return <a {...common} href={href} aria-current={selected ? 'page' : undefined}>{body}</a>
  if (onClick) {
    return (
      <button {...common} type="button" onClick={onClick} disabled={disabled} aria-pressed={selected}>
        {body}
      </button>
    )
  }
  return <div {...common} role={label ? 'img' : undefined}>{body}</div>
}

export function SlotGrid({ cols = 9, children, label }: { cols?: number; children: ReactNode; label?: string }): JSX.Element {
  return (
    <div className="bf-grid" style={{ '--cols': cols } as CSSProperties} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  )
}

export interface HotbarItem {
  readonly id: string
  readonly label: string
  readonly icon: IconName
  /** an unread count shown on the slot */
  readonly badge?: number
  readonly hint?: string
}

export interface HotbarProps {
  readonly items: readonly HotbarItem[]
  readonly value: string
  readonly onChange: (id: string) => void
  readonly label?: string
}

/**
 * The primary navigation: five slots in a row, one selected. The number keys 1-5 select, the arrow keys move, and the
 * selected slot wears the selection frame. A badge count rides on the slot and is part of its name.
 */
export function Hotbar({ items, value, onChange, label = 'Main navigation' }: HotbarProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const index = items.findIndex((i) => i.id === value)
    const digit = Number(event.key)
    let next = -1
    if (event.key === 'ArrowRight') next = (index + 1) % items.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (digit >= 1 && digit <= items.length) next = digit - 1
    if (next < 0) return
    event.preventDefault()
    onChange(items[next].id)
    ref.current?.querySelectorAll<HTMLElement>('button')[next]?.focus()
  }
  return (
    <nav aria-label={label}>
      <div className="bf-hotbar" ref={ref} onKeyDown={onKeyDown}>
        {items.map((item, i) => {
          const name = item.badge ? `${item.label}, ${item.badge} new` : item.label
          return (
            <Tooltip key={item.id} align="center" content={<span className="bf-tip__name">{item.label}</span>}>
              <button
                type="button"
                className="bf-slot"
                aria-label={name}
                aria-current={item.id === value ? 'page' : undefined}
                onClick={() => onChange(item.id)}
              >
                <span className="bf-hotbar__key" aria-hidden="true">{i + 1}</span>
                <Icon name={item.icon} shadow />
                {item.badge ? <Count value={item.badge} /> : null}
              </button>
            </Tooltip>
          )
        })}
      </div>
    </nav>
  )
}
