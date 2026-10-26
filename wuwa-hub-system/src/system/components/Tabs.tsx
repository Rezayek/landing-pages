import { useId, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from './icons'

export interface TabItem {
  readonly id: string
  readonly label: string
  readonly count?: number
  readonly disabledReason?: string
  readonly panel: ReactNode
}

/**
 * Tabs with automatic activation (WAI-ARIA): arrows move and select, Home and End jump, Tab enters the panel. The
 * fading active line (ea-activeline) slides under the current tab on --ease-sweep.
 */
export function Tabs({ label, items, initial }: { label: string; items: readonly TabItem[]; initial?: string }): JSX.Element {
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(initial ?? items[0]?.id)
  const enabled = items.filter((item) => !item.disabledReason)

  function select(next: string): void {
    setCurrent(next)
    list.current?.querySelector<HTMLButtonElement>(`[data-id="${next}"]`)?.focus()
  }
  function onKey(event: KeyboardEvent<HTMLDivElement>): void {
    const index = enabled.findIndex((item) => item.id === current)
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      select(enabled[(index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length].id)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      select(enabled[event.key === 'Home' ? 0 : enabled.length - 1].id)
    }
  }
  const active = items.find((item) => item.id === current)
  return (
    <div>
      <div ref={list} role="tablist" aria-label={label} className="ea-tabs__list" onKeyDown={onKey}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${id}-tab-${item.id}`}
            data-id={item.id}
            className="ea-tab ea-activeline"
            aria-selected={item.id === current}
            aria-controls={`${id}-panel`}
            aria-disabled={item.disabledReason ? true : undefined}
            title={item.disabledReason}
            tabIndex={item.id === current ? 0 : -1}
            onClick={() => {
              if (!item.disabledReason) setCurrent(item.id)
            }}
          >
            {item.label}
            {item.count !== undefined ? <span className="ea-tab__count">{item.count}</span> : null}
          </button>
        ))}
      </div>
      <div
        key={current}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${current}`}
        tabIndex={0}
        className="ea-tabs__panel"
      >
        {active?.panel}
      </div>
    </div>
  )
}

/** Accordion: optional detail. Headers are buttons inside headings; Enter or Space toggles. */
export function Accordion({
  items,
  multiple = false,
  initiallyOpen = [],
}: {
  items: readonly { id: string; title: string; body: ReactNode }[]
  multiple?: boolean
  initiallyOpen?: readonly string[]
}): JSX.Element {
  const id = useId()
  const [open, setOpen] = useState<readonly string[]>(initiallyOpen)
  function toggle(item: string): void {
    setOpen((current) =>
      current.includes(item) ? current.filter((x) => x !== item) : multiple ? [...current, item] : [item],
    )
  }
  return (
    <div className="ea-acc">
      {items.map((item) => {
        const expanded = open.includes(item.id)
        return (
          <div key={item.id} className="ea-acc__item">
            <h4>
              <button
                type="button"
                className="ea-acc__btn"
                aria-expanded={expanded}
                aria-controls={`${id}-${item.id}`}
                onClick={() => toggle(item.id)}
              >
                {item.title}
                <Icon name="chevronDown" />
              </button>
            </h4>
            <div id={`${id}-${item.id}`} className="ea-acc__panel" hidden={!expanded}>
              {item.body}
            </div>
          </div>
        )
      })}
    </div>
  )
}
