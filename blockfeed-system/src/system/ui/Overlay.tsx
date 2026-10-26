import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../pixel/Icon'
import type { IconName } from '../pixel/icons'
import { IconButton } from './Button'
import { useFloating } from './float'
import './ui.css'

export interface DialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: string
  readonly children: ReactNode
  /** the buttons at the bottom, laid out side by side: the safe choice first */
  readonly actions?: ReactNode
}

/**
 * A modal on the platform's own <dialog>, so focus is held inside, Escape closes it and focus returns to what opened
 * it. A click on the dimmed ground closes it too. The panel is raised and lifted with a hard shadow.
 */
export function Dialog({ open, onClose, title, children, actions }: DialogProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="bf-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="bf-lift" data-level="overlay">
        <div className="bf-panel" data-tone="raised">
          <div className="bf-dialog__body">
            <div className="bf-row bf-row--nowrap" style={{ justifyContent: 'space-between' }}>
              <h2 id={titleId} className="bf-dialog__title">
                {title}
              </h2>
              <IconButton icon="cross" label="Close" size="sm" variant="ghost" onClick={onClose} />
            </div>
            {children}
            {actions ? <div className="bf-dialog__actions">{actions}</div> : null}
          </div>
        </div>
      </div>
    </dialog>
  )
}

export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly icon?: IconName
  readonly danger?: boolean
  readonly onSelect: () => void
}

export interface MenuProps {
  readonly label: string
  readonly items: readonly MenuItem[]
  readonly icon?: IconName
  readonly align?: 'start' | 'end'
}

/** An action menu: a button that opens a short list. Arrow keys move, Enter chooses, Escape closes and returns focus. */
export function Menu({ label, items, icon = 'more', align = 'end' }: MenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLSpanElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const menuId = useId()
  useFloating(open, wrap, layer, { side: 'bottom', align: align === 'start' ? 'start' : 'end' })
  useEffect(() => {
    if (!open) return
    const first = wrap.current?.querySelector<HTMLElement>('[role=menuitem]')
    first?.focus()
    const away = (e: PointerEvent): void => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])
  function onKeyDown(e: KeyboardEvent): void {
    const nodes = [...(wrap.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]
    const i = nodes.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      setOpen(false)
      wrap.current?.querySelector<HTMLElement>('button[aria-haspopup]')?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      nodes[(i + 1) % nodes.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus()
    }
  }
  return (
    <span className="bf-menuwrap" ref={wrap} onKeyDown={onKeyDown}>
      <IconButton icon={icon} label={label} size="sm" variant="ghost" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((v) => !v)} />
      {open ? (
        <div ref={layer} popover="manual" className="bf-menu" id={menuId} role="menu" aria-label={label}>
          <div className="bf-menu__panel">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="bf-menuitem"
                data-danger={item.danger ? '' : undefined}
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
              >
                {item.icon ? <Icon name={item.icon} /> : null}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </span>
  )
}
