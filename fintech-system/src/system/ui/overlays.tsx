/**
 * Kitty's overlays (COMPONENTS.md: Menu button and menu, Popover, Dialog, Sheet, Command menu). Native <dialog> for
 * everything modal (inert background, Esc, focus trap); focus returns to the trigger on close (INTERACTION.md).
 * `inline` renders an overlay open in place, without the top layer, so the /system page can show it at rest.
 */
import { useEffect, useId, useRef, useState, type JSX, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowLeftRight, Search, X, type LucideIcon } from 'lucide-react'
import { IconButton } from './core'

export interface MenuItem {
  id: string
  label: string
  icon?: LucideIcon
  danger?: boolean
  unavailableReason?: string
  separatorBefore?: boolean
  onSelect?: () => void
}

/** Menu button (APG): ↑/↓, Home/End, type-ahead, Enter or Space to activate, Esc closes and returns focus. */
export function MenuButton({ trigger, items, align = 'start', defaultOpen = false }: { trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu'; ref: (el: HTMLButtonElement | null) => void }) => ReactNode; items: readonly MenuItem[]; align?: 'start' | 'end'; defaultOpen?: boolean }): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const triggerEl = useRef<HTMLButtonElement | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (open && !defaultOpen) list.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }, [open, defaultOpen])

  function close(returnFocus = true): void {
    setOpen(false)
    if (returnFocus) triggerEl.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent): void {
    const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const go = (i: number): void => buttons[(i + buttons.length) % buttons.length]?.focus()
    if (event.key === 'ArrowDown') go(index + 1)
    else if (event.key === 'ArrowUp') go(index - 1)
    else if (event.key === 'Home') go(0)
    else if (event.key === 'End') go(buttons.length - 1)
    else if (event.key === 'Escape') close()
    else if (event.key === 'Tab') return close(false)
    else if (event.key.length === 1) {
      const next = buttons.findIndex((b) => b.textContent?.trim().toLowerCase().startsWith(event.key.toLowerCase()))
      if (next >= 0) go(next)
    } else return
    event.preventDefault()
  }

  return (
    <div
      className="k-pop-anchor"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node) && !defaultOpen) setOpen(false)
      }}
    >
      {trigger({
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        ref: (el) => {
          triggerEl.current = el
        },
      })}
      {open ? (
        <div ref={list} id={menuId} role="menu" className="k-pop" data-align={align} data-static={defaultOpen || undefined} onKeyDown={onKeyDown}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'contents' }}>
              {item.separatorBefore ? <div className="k-menu-sep" role="separator" /> : null}
              <button
                type="button"
                role="menuitem"
                className="k-menu-item"
                tabIndex={-1}
                data-danger={item.danger || undefined}
                aria-disabled={item.unavailableReason ? true : undefined}
                aria-description={item.unavailableReason}
                onClick={() => {
                  if (item.unavailableReason) return
                  item.onSelect?.()
                  if (!defaultOpen) close()
                }}
              >
                {item.icon ? <item.icon className="k-icon" aria-hidden="true" /> : null}
                {item.label}
              </button>
              {item.unavailableReason ? (
                <span className="k-menu-reason" aria-hidden="true">
                  {item.unavailableReason}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Non-modal popover anchored to its trigger: filter options, a "what's this?" note. Esc and outside clicks close it. */
export function Popover({ trigger, title, children, footer, defaultOpen = false, align = 'start' }: { trigger: (props: { onClick: () => void; 'aria-expanded': boolean; ref: (el: HTMLButtonElement | null) => void }) => ReactNode; title?: string; children: ReactNode; footer?: (close: () => void) => ReactNode; defaultOpen?: boolean; align?: 'start' | 'end' }): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const triggerEl = useRef<HTMLButtonElement | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const close = (): void => {
    setOpen(false)
    triggerEl.current?.focus()
  }
  useEffect(() => {
    if (!open || defaultOpen) return
    panel.current?.querySelector<HTMLElement>('button, input, [tabindex="0"]')?.focus()
    const onDown = (event: PointerEvent): void => {
      if (!panel.current?.parentElement?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, defaultOpen])
  return (
    <div className="k-pop-anchor">
      {trigger({
        onClick: () => setOpen((o) => !o),
        'aria-expanded': open,
        ref: (el) => {
          triggerEl.current = el
        },
      })}
      {open ? (
        <div
          ref={panel}
          className="k-pop"
          data-padded
          data-align={align}
          data-static={defaultOpen || undefined}
          role="dialog"
          aria-labelledby={title ? titleId : undefined}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation()
              close()
            }
          }}
        >
          {title ? (
            <p id={titleId} className="k-pop__title">
              {title}
            </p>
          ) : null}
          {children}
          {footer ? <div className="k-btn-group">{footer(close)}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  kind?: 'dialog' | 'alertdialog'
  size?: 'md' | 'form'
  /** Show it in place, open, for the /system page. */
  inline?: boolean
  /** While a destructive confirm is pending, Esc and the backdrop do nothing. */
  locked?: boolean
  headingLevel?: 2 | 3 | 4
}

/** A modal on native <dialog>: focus to the first field or the safe button, back to the trigger on close. */
export function Dialog({ open, onClose, title, children, footer, kind = 'dialog', size = 'md', inline, locked, headingLevel = 2 }: DialogProps): JSX.Element | null {
  const Heading = `h${inline ? Math.max(headingLevel, 4) : headingLevel}` as 'h2'
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || inline) return
    if (open && !dialog.open) {
      returnTo.current = document.activeElement as HTMLElement
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
      returnTo.current?.focus()
    }
  }, [open, inline])

  const body = (
    <div className="k-dialog__inner">
      <div className="k-dialog__head">
        <Heading id={titleId} className="k-dialog__title">
          {title}
        </Heading>
        {kind === 'dialog' ? <IconButton icon={X} label="Close" onClick={onClose} /> : null}
      </div>
      <div className="k-dialog__body k-stack">{children}</div>
      {footer ? <div className="k-btn-group">{footer}</div> : null}
    </div>
  )

  if (inline) {
    return (
      <div className="k-dialog-frame">
        <div className="k-dialog" role={kind} aria-modal="false" aria-labelledby={titleId} data-size={size}>
          {body}
        </div>
      </div>
    )
  }
  return (
    <dialog
      ref={ref}
      className="k-dialog"
      role={kind === 'alertdialog' ? 'alertdialog' : undefined}
      aria-labelledby={titleId}
      data-size={size}
      onCancel={(event) => {
        event.preventDefault()
        if (!locked) onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current && kind === 'dialog' && !locked) onClose()
      }}
    >
      {open ? body : null}
    </dialog>
  )
}

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  side?: 'right' | 'bottom'
  children: ReactNode
  footer?: ReactNode
  inline?: boolean
  /** Inline only: a fixed frame height, so long content scrolls inside the sheet under its sticky head. */
  frameHeight?: number
}

/** Side sheet (desktop, details beside the list) or bottom sheet (phones). Swipe down closes; Close always works. */
export function Sheet({ open, onClose, title, side = 'right', children, footer, inline, frameHeight }: SheetProps): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const start = useRef<number | null>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || inline) return
    if (open && !dialog.open) {
      returnTo.current = document.activeElement as HTMLElement
      dialog.showModal()
      dialog.querySelector<HTMLElement>('h2')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      returnTo.current?.focus()
    }
  }, [open, inline])

  const content = (
    <>
      {side === 'bottom' ? <div className="k-sheet__grabber" aria-hidden="true" /> : null}
      <div className="k-sheet__head">
        {inline ? (
          <h4 id={titleId} tabIndex={-1} style={{ margin: 0, fontSize: 'var(--step-2)' }}>
            {title}
          </h4>
        ) : (
          <h2 id={titleId} tabIndex={-1}>
            {title}
          </h2>
        )}
        <IconButton icon={X} label="Close" onClick={onClose} />
      </div>
      <div className="k-sheet__body">{children}</div>
      {footer ? <div className="k-sheet__body">{footer}</div> : null}
    </>
  )

  if (inline) {
    return (
      <div className="k-sheet-frame" style={frameHeight ? { blockSize: frameHeight, minBlockSize: 0 } : undefined}>
        <div className="k-sheet" data-side={side} role="dialog" aria-labelledby={titleId} tabIndex={frameHeight ? 0 : undefined} style={frameHeight ? { maxBlockSize: '100%', overflowY: 'auto' } : undefined}>
          {content}
        </div>
      </div>
    )
  }
  return (
    <dialog
      ref={ref}
      className="k-sheet"
      data-side={side}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      onPointerDown={(event) => {
        if (side === 'bottom') start.current = event.clientY
      }}
      onPointerUp={(event) => {
        if (side === 'bottom' && start.current !== null && event.clientY - start.current > (ref.current?.offsetHeight ?? 0) * 0.3) onClose()
        start.current = null
      }}
    >
      {open ? content : null}
    </dialog>
  )
}

export interface CommandItem {
  id: string
  group: 'Go to' | 'People' | 'Transactions'
  label: string
  hint?: string
  icon?: LucideIcon
}

/** ⌘/Ctrl K: one search over destinations, people and recent transactions. */
export function CommandMenu({ open, onClose, items, inline, onChoose, initialQuery = '' }: { open: boolean; onClose: () => void; items: readonly CommandItem[]; inline?: boolean; onChoose?: (item: CommandItem) => void; initialQuery?: string }): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [active, setActive] = useState(0)
  const listId = useId()
  const matches = items.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const dialog = ref.current
    if (!dialog || inline) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open, inline])

  const groups = (['Go to', 'People', 'Transactions'] as const).map((group) => ({ group, entries: matches.filter((m) => m.group === group) }))

  const content = (
    <>
      <div className="k-command__search">
        <Search className="k-icon k-muted" aria-hidden="true" />
        <input
          role="combobox"
          aria-label="Search Kitty"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={matches[active] ? `${listId}-${matches[active].id}` : undefined}
          placeholder="Search Kitty"
          value={query}
          autoFocus={!inline}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((i) => Math.min(matches.length - 1, i + 1))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((i) => Math.max(0, i - 1))
            } else if (event.key === 'Enter' && matches[active]) {
              onChoose?.(matches[active])
              onClose()
            }
          }}
        />
      </div>
      {/* No matches: a status line, not an empty listbox */}
      <div id={listId} role={matches.length ? 'listbox' : 'status'} className="k-command__results" aria-label="Results">
        {matches.length === 0 ? (
          <p className="k-option k-muted">
            Nothing matches “{query}”
          </p>
        ) : (
          groups.map(({ group, entries }) =>
            entries.length ? (
              <div key={group} role="group" aria-label={group}>
                <div className="k-command__group" aria-hidden="true">
                  {group}
                </div>
                {entries.map((item) => {
                  const index = matches.indexOf(item)
                  const Glyph = item.icon ?? ArrowLeftRight
                  return (
                    <div
                      key={item.id}
                      id={`${listId}-${item.id}`}
                      role="option"
                      aria-selected={index === active}
                      className="k-option"
                      data-active={index === active ? true : undefined}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onChoose?.(item)
                        onClose()
                      }}
                    >
                      <Glyph className="k-icon" aria-hidden="true" />
                      {item.label}
                      {item.hint ? <span className="k-option__hint">{item.hint}</span> : null}
                    </div>
                  )
                })}
              </div>
            ) : null,
          )
        )}
      </div>
      <div className="k-command__foot" aria-hidden="true">
        ↑↓ to move · Enter to open · Esc to close
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="k-command-frame">
        <div className="k-command" role="dialog" aria-label="Search Kitty">
          {content}
        </div>
      </div>
    )
  }
  return (
    <dialog
      ref={ref}
      className="k-command"
      aria-label="Search Kitty"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {open ? content : null}
    </dialog>
  )
}
