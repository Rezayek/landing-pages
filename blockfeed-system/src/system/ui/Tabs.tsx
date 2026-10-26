import { useId, useRef, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../pixel/Icon'
import type { IconName } from '../pixel/icons'
import { Count } from './Display'
import { Panel } from './Panel'
import './ui.css'

export interface TabSpec {
  readonly id: string
  readonly label: string
  readonly icon?: IconName
  readonly count?: number
}

export interface TabsProps {
  readonly tabs: readonly TabSpec[]
  readonly value: string
  readonly onChange: (id: string) => void
  readonly label: string
  /** the content of the active tab, set in the panel under the tabs */
  readonly children: ReactNode
  /** drop the panel: the caller renders the tab's content itself */
  readonly bare?: boolean
}

/** Tabs that stand on a panel: the chosen tab is the panel's colour and joins it. Arrow keys, Home and End move. */
export function Tabs({ tabs, value, onChange, label, children, bare }: TabsProps): JSX.Element {
  const base = useId()
  const list = useRef<HTMLDivElement>(null)
  function onKeyDown(event: KeyboardEvent): void {
    const index = tabs.findIndex((t) => t.id === value)
    let next = -1
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next < 0) return
    event.preventDefault()
    onChange(tabs[next].id)
    list.current?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus()
  }
  return (
    <div className="bf-tabs">
      <div className="bf-tablist" role="tablist" aria-label={label} ref={list} onKeyDown={onKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${base}-${t.id}`}
            aria-selected={t.id === value}
            aria-controls={`${base}-panel`}
            tabIndex={t.id === value ? 0 : -1}
            className="bf-tab"
            onClick={() => onChange(t.id)}
          >
            {t.icon ? <Icon name={t.icon} /> : null}
            {t.label}
            {t.count ? <Count value={t.count} tone="quiet" /> : null}
          </button>
        ))}
      </div>
      {bare ? (
        <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${value}`} tabIndex={0} className="bf-tabpanel">
          {children}
        </div>
      ) : (
        <Panel role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-${value}`} tabIndex={0} className="bf-tabpanel">
          {children}
        </Panel>
      )}
    </div>
  )
}
